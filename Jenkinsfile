pipeline {
    agent any

    environment {
        AWS_REGION   = "us-east-1"
        ACCOUNT_ID   = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        CLUSTER_NAME = "naresh"
        NAMESPACE    = "authors-books"

        IMAGE_TAG = "${BUILD_NUMBER}"

        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:${IMAGE_TAG}"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:${IMAGE_TAG}"
        MYSQL_IMAGE    = "${ECR_REGISTRY}/authors-books-mysql:${IMAGE_TAG}"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("Login to ECR") {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage("Cleanup Old Docker (Safe)") {
            steps {
                sh '''
                docker rm -f mysql-test backend-test frontend-test 2>/dev/null || true
                docker network rm test-net 2>/dev/null || true
                '''
            }
        }

        stage("Build Docker Images") {
            steps {
                sh '''
                docker build -t authors-books-backend:local ./backend
                docker build -t authors-books-frontend:local ./frontend

                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Docker Containers (EC2 Verification)") {
            steps {
                sh '''
                docker network create test-net || true

                echo "▶ MySQL"
                docker run -d --name mysql-test \
                  --network test-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  authors-books-mysql:local

                sleep 25

                echo "▶ Backend"
                docker run -d --name backend-test \
                  --network test-net \
                  -e DB_HOST=mysql-test \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:local

                sleep 15
                curl -f http://localhost:3000/api || true

                echo "▶ Frontend"
                docker run -d --name frontend-test \
                  --network test-net \
                  -p 80:80 \
                  authors-books-frontend:local

                sleep 10
                echo "✅ Docker verification completed"
                '''
            }
        }

        stage("Tag & Push Images to ECR") {
            steps {
                sh '''
                docker tag authors-books-backend:local  $BACKEND_IMAGE
                docker tag authors-books-frontend:local $FRONTEND_IMAGE
                docker tag authors-books-mysql:local    $MYSQL_IMAGE

                docker push $BACKEND_IMAGE
                docker push $FRONTEND_IMAGE
                docker push $MYSQL_IMAGE
                '''
            }
        }

        stage("Configure kubeconfig") {
            steps {
                sh '''
                aws eks update-kubeconfig \
                  --region $AWS_REGION \
                  --name $CLUSTER_NAME
                kubectl get nodes
                '''
            }
        }

        stage("Deploy to Kubernetes") {
            steps {
                sh '''
                kubectl apply -f k8s/namespace.yaml

                kubectl apply -f k8s/mysql.yaml
                kubectl apply -f k8s/backend.yaml
                kubectl apply -f k8s/frontend.yaml

                kubectl set image deployment/mysql mysql=$MYSQL_IMAGE -n $NAMESPACE
                kubectl set image deployment/backend backend=$BACKEND_IMAGE -n $NAMESPACE
                kubectl set image deployment/frontend frontend=$FRONTEND_IMAGE -n $NAMESPACE

                kubectl rollout status deployment/mysql -n $NAMESPACE
                kubectl rollout status deployment/backend -n $NAMESPACE
                kubectl rollout status deployment/frontend -n $NAMESPACE
                '''
            }
        }
    }

    post {
        always {
            sh '''
            docker system prune -f
            '''
        }
    }
}
