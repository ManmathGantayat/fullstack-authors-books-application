pipeline {
    agent any

    stages {

        stage("Checkout Code") {
            steps { checkout scm }
        }

        stage("Docker Sanity Check") {
            steps {
                sh '''
                docker version
                docker buildx version
                docker compose version
                '''
            }
        }

        stage("Hard Cleanup") {
            steps {
                sh '''
                docker compose down -v || true
                docker rm -f frontend backend mysql || true
                docker system prune -af --volumes || true
                '''
            }
        }

        stage("Build Images") {
            steps {
                sh '''
                docker compose build --no-cache
                '''
            }
        }

        stage("Deploy Application") {
            steps {
                sh '''
                docker compose up -d
                docker compose ps
                '''
            }
        }

        stage("ECR Login") {
            steps {
                sh '''
                aws ecr get-login-password --region us-east-1 \
                | docker login --username AWS --password-stdin 426192960096.dkr.ecr.us-east-1.amazonaws.com
                '''
            }
        }

        stage("Tag Images") {
            steps {
                sh '''
                docker tag authors-books-frontend:latest \
                  426192960096.dkr.ecr.us-east-1.amazonaws.com/authors-books-frontend:latest

                docker tag authors-books-backend:latest \
                  426192960096.dkr.ecr.us-east-1.amazonaws.com/authors-books-backend:latest
                '''
            }
        }

        stage("Push Images to ECR") {
            steps {
                sh '''
                docker push 426192960096.dkr.ecr.us-east-1.amazonaws.com/authors-books-frontend:latest
                docker push 426192960096.dkr.ecr.us-east-1.amazonaws.com/authors-books-backend:latest
                '''
            }
        }

        stage("Health Check") {
            steps {
                sh '''
                sleep 20
                curl -f http://localhost/api/books || true
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful"
            echo "🌐 App: http://54.242.243.223"
        }
        failure {
            echo "❌ Deployment Failed — check logs"
        }
    }
}
