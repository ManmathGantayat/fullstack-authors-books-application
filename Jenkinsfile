pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ECR_REGISTRY = "426192960096.dkr.ecr.us-east-1.amazonaws.com"

        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:latest"
    }

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
        }

        stage("Docker & Tool Sanity Check") {
            steps {
                sh '''
                docker version
                docker compose version
                aws --version
                kubectl version --client
                '''
            }
        }

        stage("AUTOMATED HARD CLEANUP (Docker)") {
            steps {
                sh '''
                docker rm -f frontend backend mysql || true
                docker rmi -f $(docker images | awk '/authors-books/ {print $3}') || true
                docker system prune -af || true
                '''
            }
        }

        stage("Build Images (Fresh)") {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage("Run Containers (Docker Validation)") {
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
                aws ecr get-login-password --region $AWS_REGION |
                docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage("Tag Images for ECR") {
            steps {
                sh '''
                docker tag authors-books-frontend:latest $FRONTEND_IMAGE
                docker tag authors-books-backend:latest  $BACKEND_IMAGE
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

        stage("Deploy to Kubernetes") {
            steps {
                sh '''
                kubectl apply -f k8s/namespace.yaml
                kubectl apply -f k8s/mysql.yaml
                kubectl apply -f k8s/backend.yaml
                kubectl apply -f k8s/frontend.yaml
                '''
            }
        }

        stage("Verify Kubernetes Deployment") {
            steps {
                sh '''
                kubectl get pods -n authors-books
                kubectl get svc  -n authors-books
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 FULL CI/CD PIPELINE SUCCESSFUL"
        }
        failure {
            echo "❌ PIPELINE FAILED — check logs"
        }
    }
}
