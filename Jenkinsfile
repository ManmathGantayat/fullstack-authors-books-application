pipeline {
  agent any

  environment {
    AWS_REGION = "us-east-1"
    ECR_REGISTRY = "426192960096.dkr.ecr.us-east-1.amazonaws.com"
    FRONTEND_REPO = "authors-books-frontend"
    BACKEND_REPO  = "authors-books-backend"
    MYSQL_REPO    = "authors-books-mysql"
  }

  stages {

    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('Login to ECR') {
      steps {
        sh '''
        aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $ECR_REGISTRY
        '''
      }
    }

    stage('Cleanup Old Docker') {
      steps {
        sh '''
        docker ps -aq | xargs -r docker rm -f
        docker images -aq | xargs -r docker rmi -f
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
        docker build -t $BACKEND_REPO backend/
        docker build -t $FRONTEND_REPO frontend/
        docker pull mysql:8.0
        docker tag mysql:8.0 $MYSQL_REPO
        '''
      }
    }

    stage('Tag & Push to ECR') {
      steps {
        sh '''
        docker tag $BACKEND_REPO:latest $ECR_REGISTRY/$BACKEND_REPO:latest
        docker tag $FRONTEND_REPO:latest $ECR_REGISTRY/$FRONTEND_REPO:latest
        docker tag $MYSQL_REPO:latest $ECR_REGISTRY/$MYSQL_REPO:latest

        docker push $ECR_REGISTRY/$BACKEND_REPO:latest
        docker push $ECR_REGISTRY/$FRONTEND_REPO:latest
        docker push $ECR_REGISTRY/$MYSQL_REPO:latest
        '''
      }
    }

    stage('Cleanup Kubernetes (Safe)') {
      steps {
        sh '''
        kubectl delete namespace authors-books --ignore-not-found=true
        sleep 10
        '''
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh '''
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/mysql.yaml
        kubectl apply -f k8s/backend.yaml
        kubectl apply -f k8s/frontend.yaml
        '''
      }
    }
  }
}
