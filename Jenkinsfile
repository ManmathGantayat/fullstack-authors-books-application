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
