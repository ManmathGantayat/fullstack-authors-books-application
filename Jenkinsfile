pipeline {
  agent any

  environment {
    AWS_REGION = "us-east-1"
    ECR_REGISTRY = "426192960096.dkr.ecr.us-east-1.amazonaws.com"
  }

  stages {

    stage('Clone Repo') {
      steps {
        checkout scm
      }
    }

    stage('Login to ECR') {
      steps {
        sh '''
          aws ecr get-login-password --region $AWS_REGION |
          docker login --username AWS --password-stdin $ECR_REGISTRY
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
          docker build -t authors-books-backend ./backend
          docker build -t authors-books-frontend ./frontend
          docker build -t authors-books-mysql ./backend
        '''
      }
    }

    stage('Tag & Push Images') {
      steps {
        sh '''
          docker tag authors-books-backend $ECR_REGISTRY/authors-books-backend:latest
          docker tag authors-books-frontend $ECR_REGISTRY/authors-books-frontend:latest
          docker tag authors-books-mysql $ECR_REGISTRY/authors-books-mysql:latest

          docker push $ECR_REGISTRY/authors-books-backend:latest
          docker push $ECR_REGISTRY/authors-books-frontend:latest
          docker push $ECR_REGISTRY/authors-books-mysql:latest
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
