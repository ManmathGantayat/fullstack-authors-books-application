pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_REGISTRY = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:latest"
    }

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
                aws sts get-caller-identity
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

        stage("Build Images") {
            steps {
                sh '''
                docker compose build --no-cache
                '''
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

        stage("Tag Images") {
            steps {
                sh '''
                docker tag frontend:latest $FRONTEND_IMAGE
                docker tag backend:latest  $BACKEND_IMAGE
                '''
            }
        }

        stage("Push Images to ECR") {
            steps {
                sh '''
                docker push $FRONTEND_IMAGE
                docker push $BACKEND_IMAGE
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

        stage("Health Check") {
            steps {
                sh '''
                sleep 20
                curl -f http://localhost/api/books
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful"
            echo "🌐 App URL: http://EC2_PUBLIC_IP"
        }
        failure {
            echo "❌ Deployment Failed — check logs"
        }
    }
}
