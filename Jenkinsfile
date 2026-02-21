pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        CLUSTER_NAME = "naresh"
        NAMESPACE = "authors-books"

        BACKEND_IMAGE = "${ECR_REGISTRY}/authors-books-backend:latest"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        MYSQL_IMAGE = "${ECR_REGISTRY}/authors-books-mysql:latest"
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
                docker ps -aq | xargs -r docker rm -f
                docker images -q | xargs -r docker rmi -f
                '''
            }
        }

        stage("Build Docker Images") {
            steps {
                sh '''
                docker build -t authors-books-backend backend
                docker build -t authors-books-frontend frontend
                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql
                '''
            }
        }

        // 🔥 THIS IS THE MISSING PART YOU WANT
        stage("Run Containers for Verification (TEMP)") {
            steps {
                sh '''
                docker network create test-net || true

                docker run -d --name mysql-test \
                  --network test-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  authors-books-mysql

                sleep 20

                docker run -d --name backend-test \
                  --network test-net \
                  -e DB_HOST=mysql-test \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend

                sleep 10
                curl -f http://localhost:3000/api || exit 1
                '''
            }
        }

        stage("Cleanup Test Containers") {
            steps {
                sh '''
                docker rm -f mysql-test backend-test || true
                docker network rm test-net || true
                '''
            }
        }

        stage("Tag & Push to ECR") {
            steps {
                sh '''
                docker tag authors-books-backend $BACKEND_IMAGE
                docker tag authors-books-frontend $FRONTEND_IMAGE
                docker tag authors-books-mysql $MYSQL_IMAGE

                docker push $BACKEND_IMAGE
                docker push $FRONTEND_IMAGE
                docker push $MYSQL_IMAGE
                '''
            }
        }

        stage("Configure kubeconfig (CRITICAL)") {
            steps {
                sh '''
                aws eks update-kubeconfig \
                  --region $AWS_REGION \
                  --name $CLUSTER_NAME
                kubectl get nodes
                '''
            }
        }

        stage("Cleanup Kubernetes (Safe)") {
            steps {
                sh '''
                kubectl delete namespace $NAMESPACE --ignore-not-found=true
                sleep 15
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
                '''
            }
        }
    }
}
