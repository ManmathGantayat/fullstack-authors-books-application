pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:latest"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        MYSQL_IMAGE    = "${ECR_REGISTRY}/authors-books-mysql:latest"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("HARD Docker Cleanup (Ports + Containers)") {
            steps {
                sh '''
                echo "🔥 HARD cleanup"

                docker rm -f frontend backend mysql || true
                docker network rm authors-net || true

                # Kill anything holding ports 3000 or 80
                fuser -k 3000/tcp || true
                fuser -k 80/tcp || true

                docker system prune -af --volumes || true
                '''
            }
        }

        stage("Build Docker Images (Fresh)") {
            steps {
                sh '''
                docker build -t authors-books-backend:latest ./backend
                docker build -t authors-books-frontend:latest ./frontend

                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:latest
                '''
            }
        }

        stage("Run Containers (Fresh & Safe)") {
            steps {
                sh '''
                set -e

                echo "🌐 Creating network"
                docker network create authors-net

                echo "🗄️ Starting MySQL"
                docker run -d --name mysql \
                  --network authors-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  -v $(pwd)/backend/db.sql:/docker-entrypoint-initdb.d/db.sql \
                  --health-cmd="mysqladmin ping -h localhost" \
                  --health-interval=5s \
                  --health-retries=20 \
                  authors-books-mysql:latest

                echo "⏳ Waiting for MySQL to be healthy"
                until [ "$(docker inspect -f '{{.State.Health.Status}}' mysql)" = "healthy" ]; do
                  sleep 5
                done

                echo "✅ MySQL is healthy"

                echo "🚀 Starting Backend"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:latest

                echo "⏳ Waiting for backend startup"
                sleep 20
                docker logs backend

                echo "🧪 Backend API check"
                curl -f http://localhost:3000/api/books

                echo "🌍 Starting Frontend"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:latest

                echo "🎉 Docker deployment SUCCESS"
                '''
            }
        }

        stage("Login & Push Images to ECR") {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ECR_REGISTRY

                docker tag authors-books-backend:latest  $BACKEND_IMAGE
                docker tag authors-books-frontend:latest $FRONTEND_IMAGE
                docker tag authors-books-mysql:latest    $MYSQL_IMAGE

                docker push $BACKEND_IMAGE
                docker push $FRONTEND_IMAGE
                docker push $MYSQL_IMAGE
                '''
            }
        }
    }

    post {
        success {
            echo "✅ SUCCESS"
            echo "Frontend: http://13.219.99.125"
            echo "Backend : http://13.219.99.125:3000/api/books"
        }
        failure {
            echo "❌ FAILED — check logs above"
        }
    }
}
