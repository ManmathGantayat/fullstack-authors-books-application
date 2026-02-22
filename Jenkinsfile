pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        BACKEND_ECR  = "${ECR_REGISTRY}/authors-books-backend:latest"
        FRONTEND_ECR = "${ECR_REGISTRY}/authors-books-frontend:latest"
        MYSQL_ECR    = "${ECR_REGISTRY}/authors-books-mysql:latest"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("HARD Docker Reset (Ports + Containers + Images)") {
            steps {
                sh '''
                echo "🔥 Killing processes on ports 80 & 3000"
                sudo fuser -k 80/tcp || true
                sudo fuser -k 3000/tcp || true

                echo "🧹 Removing containers"
                docker rm -f $(docker ps -aq) 2>/dev/null || true

                echo "🧹 Removing images"
                docker rmi -f $(docker images -aq) 2>/dev/null || true

                echo "🧹 Removing networks"
                docker network prune -f

                echo "🧹 System prune"
                docker system prune -af
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

        stage("Build Docker Images") {
            steps {
                sh '''
                echo "🐳 Build backend"
                docker build -t authors-books-backend:latest ./backend

                echo "🐳 Build frontend"
                docker build -t authors-books-frontend:latest ./frontend

                echo "🐳 Prepare MySQL"
                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:latest
                '''
            }
        }

        stage("Run Containers (Fresh)") {
            steps {
                sh '''
                set -e

                docker network create authors-net

                echo "🗄️ MySQL"
                docker run -d --name mysql \
                  --network authors-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  -v $(pwd)/backend/db.sql:/docker-entrypoint-initdb.d/db.sql \
                  authors-books-mysql:latest

                echo "⏳ Waiting for MySQL"
                for i in {1..40}; do
                  docker exec mysql mysqladmin ping -h localhost --silent && break
                  sleep 2
                done

                echo "🚀 Backend"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:latest

                sleep 15
                docker logs backend

                echo "🌍 Frontend"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:latest

                echo "🧪 Backend API check"
                curl -f http://localhost:3000/api/books
                '''
            }
        }

        stage("Push Images to ECR") {
            steps {
                sh '''
                docker tag authors-books-backend:latest  $BACKEND_ECR
                docker tag authors-books-frontend:latest $FRONTEND_ECR
                docker tag authors-books-mysql:latest    $MYSQL_ECR

                docker push $BACKEND_ECR
                docker push $FRONTEND_ECR
                docker push $MYSQL_ECR
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 DEPLOYMENT SUCCESSFUL"
            echo "👉 Frontend: http://13.219.99.125"
            echo "👉 Backend : http://13.219.99.125:3000/api/books"
        }
        failure {
            echo "❌ FAILED — check logs above"
        }
    }
}
