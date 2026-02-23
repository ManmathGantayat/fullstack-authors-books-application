pipeline {
    agent any

    environment {
        AWS_REGION     = "us-east-1"
        AWS_ACCOUNT_ID = "426192960096"
        ECR_REGISTRY   = "426192960096.dkr.ecr.us-east-1.amazonaws.com"

        FRONTEND_IMAGE = "${ECR_REGISTRY}/authors-books-frontend:latest"
        BACKEND_IMAGE  = "${ECR_REGISTRY}/authors-books-backend:latest"
        K8S_NAMESPACE  = "authors-books"
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
                docker buildx version
                docker compose version
                aws --version
                kubectl version --client
                '''
            }
        }

        stage("AUTOMATED HARD CLEANUP (Docker – SAFE)") {
            steps {
                sh '''
                echo "Stopping containers if present..."
                docker rm -f frontend backend mysql || true

                echo "Removing project images only..."
                docker rmi -f $(docker images | awk '/authors-books/ {print $3}') || true

                echo "Pruning unused networks & volumes (safe)..."
                docker network prune -f || true
                docker volume prune -f || true
                '''
            }
        }

        stage("Build Images (Fresh)") {
            steps {
                sh '''
                docker compose build --no-cache
                '''
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
                aws ecr get-login-password --region $AWS_REGION \
                | docker login --username AWS --password-stdin $ECR_REGISTRY
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

        stage("Stop Docker Validation Containers") {
            steps {
                sh '''
                docker compose down || true
                '''
            }
        }

        stage("Deploy to Kubernetes") {
            steps {
                sh '''
                kubectl apply -f k8s/namespace.yaml || true
                kubectl apply -f k8s/mysql.yaml
                kubectl apply -f k8s/backend.yaml
                kubectl apply -f k8s/frontend.yaml
                '''
            }
        }

        stage("Verify Kubernetes Deployment") {
            steps {
                sh '''
                kubectl rollout status deployment/mysql     -n $K8S_NAMESPACE
                kubectl rollout status deployment/backend   -n $K8S_NAMESPACE
                kubectl rollout status deployment/frontend  -n $K8S_NAMESPACE

                kubectl get pods -n $K8S_NAMESPACE
                kubectl get svc  -n $K8S_NAMESPACE
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 FULL CI/CD PIPELINE SUCCESSFUL"
            echo "🚀 Docker → ECR → Kubernetes deployment completed"
        }
        failure {
            echo "❌ PIPELINE FAILED — check logs"
        }
    }
}
