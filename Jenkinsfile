pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:latest"
        MYSQL_IMAGE    = "${ECR_REGISTRY}/authors-books-mysql:latest"
    }

    stages {

        stage("Checkout Code") {
            steps { checkout scm }
        }

        stage("ECR Login") {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage("Hard Docker Cleanup") {
            steps {
                sh '''
                docker rm -f frontend backend mysql || true
                docker network rm authors-net || true
                docker system prune -af --volumes || true
                '''
            }
        }

        stage("Build Images (Fresh)") {
            steps {
                sh '''
                docker build -t authors-books-backend:local ./backend
                docker build -t authors-books-frontend:local ./frontend

                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Containers (Single Port)") {
            steps {
                sh '''
                set -e

                docker network create authors-net

                echo "🗄 MySQL"
                docker run -d --name mysql \
                  --network authors-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  -v $(pwd)/backend/db.sql:/docker-entrypoint-initdb.d/db.sql \
                  authors-books-mysql:local

                echo "⏳ Waiting for MySQL"
                for i in {1..30}; do
                  docker exec mysql mysqladmin ping -h localhost --silent && break
                  sleep 2
                done

                echo "🚀 Backend (internal only)"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  authors-books-backend:local

                echo "🌍 Frontend (PUBLIC PORT 80)"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:local

                echo "✅ Containers running"
                '''
            }
        }

        stage("Tag & Push to ECR") {
            steps {
                sh '''
                docker tag authors-books-frontend:local $FRONTEND_IMAGE
                docker tag authors-books-backend:local  $BACKEND_IMAGE
                docker tag authors-books-mysql:local    $MYSQL_IMAGE

                docker push $FRONTEND_IMAGE
                docker push $BACKEND_IMAGE
                docker push $MYSQL_IMAGE
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 SUCCESS"
            echo "👉 App: http://13.219.99.125"
            echo "👉 API: http://13.219.99.125/api/books"
        }
        failure {
            echo "❌ FAILED — check logs"
        }
    }
}
