pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        AWS_ACCOUNT_ID = "426192960096"
        ECR_BACKEND = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-backend"
        ECR_FRONTEND = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-frontend"
        ECR_MYSQL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-mysql"
        NAMESPACE = "authors-books"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/ManmathGantayat/fullstack-authors-books-application.git'
            }
        }

        stage('Login to ECR') {
            steps {
                sh """
                aws ecr get-login-password --region $AWS_REGION | \
                docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                """
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh """
                    docker build -t authors-backend .
                    docker tag authors-backend:latest $ECR_BACKEND:$IMAGE_TAG
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh """
                    docker build -t authors-frontend .
                    docker tag authors-frontend:latest $ECR_FRONTEND:$IMAGE_TAG
                    """
                }
            }
        }

        stage('Tag MySQL Image') {
            steps {
                sh """
                docker pull mysql:8.0
                docker tag mysql:8.0 $ECR_MYSQL:$IMAGE_TAG
                """
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh """
                docker push $ECR_BACKEND:$IMAGE_TAG
                docker push $ECR_FRONTEND:$IMAGE_TAG
                docker push $ECR_MYSQL:$IMAGE_TAG
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

                # Deploy MySQL
                kubectl set image deployment/mysql mysql=$ECR_MYSQL:$IMAGE_TAG -n $NAMESPACE || true
                kubectl apply -f k8s/mysql.yaml

                # Wait for MySQL ready
                kubectl rollout status deployment/mysql -n $NAMESPACE

                # Deploy Backend
                kubectl set image deployment/backend backend=$ECR_BACKEND:$IMAGE_TAG -n $NAMESPACE || true
                kubectl apply -f k8s/backend.yaml
                kubectl rollout status deployment/backend -n $NAMESPACE

                # Deploy Frontend
                kubectl set image deployment/frontend frontend=$ECR_FRONTEND:$IMAGE_TAG -n $NAMESPACE || true
                kubectl apply -f k8s/frontend.yaml
                kubectl rollout status deployment/frontend -n $NAMESPACE
                """
            }
        }
    }

    post {
        always {
            sh "docker system prune -f"
        }
    }
}
