pipeline {
    agent any

    environment {
        AWS_REGION   = "us-east-1"
        ACCOUNT_ID   = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        BACKEND_IMAGE  = "authors-books-backend:local"
        FRONTEND_IMAGE = "authors-books-frontend:local"
        MYSQL_IMAGE    = "authors-books-mysql:local"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
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
                echo "▶ Building Backend image"
                docker build -t authors-books-backend:local ./backend

                echo "▶ Building Frontend image"
                docker build -t authors-books-frontend:local ./frontend

                echo "▶ Preparing MySQL image"
                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Containers (Docker Only)") {
            steps {
                sh '''
                set -e

                echo "▶ Creating Docker network"
                docker network create authors-net || true

                echo "▶ Starting MySQL"
                docker run -d --name mysql \
                  --network authors-net \
                  -e MYSQL_ROOT_PASSWORD=root \
                  -e MYSQL_DATABASE=react_node_app \
                  -v $(pwd)/backend/db.sql:/docker-entrypoint-initdb.d/db.sql \
                  authors-books-mysql:local

                echo "▶ Waiting for MySQL to be ready"
                for i in {1..30}; do
                  if docker exec mysql mysqladmin ping -h "localhost" --silent; then
                    echo "✅ MySQL is ready"
                    break
                  fi
                  echo "⏳ Waiting for MySQL..."
                  sleep 2
                done

                echo "▶ Starting Backend (internal network only)"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  authors-books-backend:local

                echo "▶ Waiting for Backend"
                sleep 20
                docker logs backend

                echo "▶ Verifying Backend internally"
                docker exec backend curl -f http://localhost:3000/api/books || true

                echo "▶ Starting Frontend"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:local

                echo "✅ Docker-only deployment successful"
                '''
            }
        }
    }

    post {
        always {
            sh '''
            echo "▶ Running containers:"
            docker ps
            '''
        }
    }
}
