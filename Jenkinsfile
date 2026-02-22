pipeline {
    agent any

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("Docker Cleanup (Hard Reset)") {
            steps {
                sh '''
                echo "🧹 Cleaning old containers, networks & ports"
                docker rm -f frontend backend mysql || true
                docker network rm authors-net || true
                docker system prune -af || true
                '''
            }
        }

        stage("Build Docker Images") {
            steps {
                sh '''
                echo "🐳 Building backend image"
                docker build -t authors-books-backend:local ./backend

                echo "🐳 Building frontend image"
                docker build -t authors-books-frontend:local ./frontend

                echo "🐳 Preparing MySQL image"
                docker pull mysql:8.0
                docker tag mysql:8.0 authors-books-mysql:local
                '''
            }
        }

        stage("Run Containers (Docker Only)") {
            steps {
                sh '''
                set -e

                echo "🌐 Creating Docker network"
                docker network create authors-net

                echo "🗄️ Starting MySQL"
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

                echo "✅ MySQL is ready"

                echo "🚀 Starting Backend (exposed on 3000)"
                docker run -d --name backend \
                  --network authors-net \
                  -e DB_HOST=mysql \
                  -e DB_PORT=3306 \
                  -e DB_USER=root \
                  -e DB_PASSWORD=root \
                  -e DB_NAME=react_node_app \
                  -p 3000:3000 \
                  authors-books-backend:local

                echo "⏳ Waiting for Backend"
                sleep 15
                docker logs backend

                echo "🧪 Testing Backend API"
                curl -f http://localhost:3000/api/books || true

                echo "🌍 Starting Frontend (exposed on 80)"
                docker run -d --name frontend \
                  --network authors-net \
                  -p 80:80 \
                  authors-books-frontend:local

                echo "✅ Docker deployment SUCCESSFUL"
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 Application is LIVE"
            echo "👉 Frontend: http://13.219.99.125"
            echo "👉 Backend : http://13.219.99.125:3000/api/books"
        }
        failure {
            echo "❌ Build failed — check container logs"
        }
    }
}
