pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("ECR Login") {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage("Hard Cleanup") {
            steps {
                sh '''
                docker compose down -v || true
                docker system prune -af --volumes || true
                '''
            }
        }

        stage("Build & Run (Docker Compose)") {
            steps {
                sh '''
                docker compose build --no-cache
                docker compose up -d
                '''
            }
        }

        stage("Verify") {
            steps {
                sh '''
                sleep 10
                curl -f http://localhost/api/books
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 DEPLOYMENT SUCCESS"
            echo "👉 App: http://<EC2_PUBLIC_IP>"
            echo "👉 API: http://<EC2_PUBLIC_IP>/api/books"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED"
        }
    }
}
