pipeline {
    agent any

    environment {
        AWS_REGION   = "us-east-1"
        ACCOUNT_ID   = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        IMAGE_TAG = "${BUILD_NUMBER}"

        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:${IMAGE_TAG}"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:${IMAGE_TAG}"
        MYSQL_IMAGE    = "${ECR_REGISTRY}/authors-books-mysql:${IMAGE_TAG}"

        EC2_PUBLIC_IP = "13.219.99.125"   // 🔴 CHANGE ONLY IF EC2 IP CHANGES
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

        stage("Cleanup Old Containers") {
            steps {
                sh '''
                docker rm -f mysql backend frontend 2>/dev/null || true
                docker network rm authors-net 2>/dev/null || true
                '''
            }
        }

        stage("Build Docker Images") {
            steps {
                sh '''
                docker build -t authors-books-backend:local ./backend

                docker build \
                  --build-arg VITE_API_URL=http://$EC2_PUBLIC_IP:3000/api \
                  -t authors-books-frontend:local \
                  ./frontend

                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Containers (Docker Only)") {
            steps {
                sh '''
                docker network create authors-net

                echo "▶ Starting MySQL"
                docker run -d --name mysql \
                  --network authors-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  -v $(pwd)/backend/db.sql:/docker-entrypoint-initdb.d/db.sql \
                  authors-books-mysql:local

                echo "▶ Waiting for MySQL"
                sleep 40

                echo "▶ Starting Backend"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:local

                echo "▶ Waiting for Backend"
                sleep 20
                curl -f http://localhost:3000/api/books

                echo "▶ Starting Frontend"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:local

                echo "✅ Docker deployment successful"
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
    }

    post {
        always {
            sh '''
            docker system prune -f
            '''
        }
    }
}
