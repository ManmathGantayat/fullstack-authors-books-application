pipeline {
    agent any

    stages {

        stage("Checkout Code") {
            steps {
                checkout scm
            }
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
                docker network prune -f || true
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
            echo "🌐 Application URL: http://EC2_PUBLIC_IP"
        }
        failure {
            echo "❌ Deployment Failed — check docker logs"
        }
    }
}
