pipeline {
    agent any

    environment {
        AWS_REGION = "us-east-1"
        ACCOUNT_ID = "426192960096"
        ECR_BACKEND = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-backend"
        ECR_FRONTEND = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-frontend"
        ECR_MYSQL = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/authors-books-mysql"
        TAG = "v${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/ManmathGantayat/fullstack-authors-books-application.git'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t backend:${TAG} backend
                docker build -t frontend:${TAG} frontend
                docker build -t mysql:${TAG} backend
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION | \
                docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                '''
            }
        }

        stage('Tag & Push Images') {
            steps {
                sh '''
                docker tag backend:${TAG} $ECR_BACKEND:${TAG}
                docker tag frontend:${TAG} $ECR_FRONTEND:${TAG}
                docker tag mysql:${TAG} $ECR_MYSQL:${TAG}

                docker push $ECR_BACKEND:${TAG}
                docker push $ECR_FRONTEND:${TAG}
                docker push $ECR_MYSQL:${TAG}
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl apply -f k8s/
                '''
            }
        }
    }
}
