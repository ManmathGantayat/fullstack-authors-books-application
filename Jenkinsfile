pipeline {
    agent any

    environment {
        AWS_REGION   = "us-east-1"
        ACCOUNT_ID   = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG    = "${BUILD_NUMBER}"

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

        stage("HARD Docker Cleanup") {
            steps {
                sh '''
                echo "🧹 HARD cleanup: containers, images, networks, ports"
                docker rm -f frontend backend mysql || true
                docker rmi -f authors-books-backend authors-books-frontend authors-books-mysql || true
                docker network rm authors-net || true
                docker system prune -af || true
                '''
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

        stage("Build Images (NO CACHE)") {
            steps {
                sh '''
                docker build --no-cache -t authors-books-backend:local ./backend
                docker build --no-cache -t authors-books-frontend:local ./frontend
                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Containers (Fresh)") {
            steps {
                sh '''
                set -e

                docker network create authors-net

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

                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:local

                sleep 15
                curl -f http://localhost:3000/api/books

                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:local
                '''
            }
        }

        stage("Tag & Push to ECR") {
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
        success {
            echo "🎉 SUCCESS"
            echo "Frontend: http://13.219.99.125"
            echo "Backend : http://13.219.99.125:3000/api/books"
        }
    }
}
