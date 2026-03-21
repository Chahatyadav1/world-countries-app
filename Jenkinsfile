pipeline {
    agent any

    tools {
        nodejs 'nodejs-24-14-0'
        jdk 'jdk-21'
    }

    environment {
        MONGO_URI          = "mongodb+srv://supercluster.d83jj.mongodb.net/superData"
        MONGO_DB_CREDS     = credentials('mongo-db-credentials')
        MONGO_USERNAME     = credentials('mongouser')
        MONGO_PASSWORD     = credentials('mongopassword')
        SONAR_SCANNER_HOME = tool 'sonarqube'
        PATH = "/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:${env.PATH}"
    }

    options {
        disableResume()
        disableConcurrentBuilds abortPrevious: true
    }

    stages {

        stage('Installing Dependencies') {
            options { timestamps() }
            steps {
                sh 'npm install --no-audit'
            }
        }

        stage('Dependency Scanning') {
            parallel {

                stage('NPM Dependency Audit') {
                    steps {
                        sh '''
                            npm audit --audit-level=critical
                            echo $?
                        '''
                    }
                }

                stage('OWASP Dependency Check') {
                    environment {
                        NVD_API_KEY = credentials('nvd-api-key')
                    }
                    steps {
                        dependencyCheck additionalArguments: """
                            --scan './'
                            --out './'
                            --format 'ALL'
                            --disableYarnAudit
                            --prettyPrint
                            --suppression dependency-check-suppression.xml
                            --nvdApiKey $NVD_API_KEY
                        """, odcInstallation: 'OWASP'

                        dependencyCheckPublisher(
                            failedTotalCritical: 1,
                            pattern: 'dependency-check-report.xml',
                            stopBuild: false
                        )
                    }
                }
            }
        }

        stage('Unit Testing') {
            options { retry(2) }
            steps {
                sh 'echo Colon-Separated - $MONGO_DB_CREDS'
                sh 'echo Username - $MONGO_DB_CREDS_USR'
                sh 'echo Password - $MONGO_DB_CREDS_PSW'
                sh 'npm test'
            }
        }

        stage('Code Coverage') {
            steps {
                catchError(
                    buildResult: 'SUCCESS',
                    message: 'Oops! it will be fixed in future releases',
                    stageResult: 'UNSTABLE'
                ) {
                    sh 'npm run coverage'
                }
            }
        }

        stage('SAST - SonarQube') {
            steps {
                sh 'sleep 5s'
                withSonarQubeEnv('sonar-qube') {
                    sh 'echo "DEBUG SONAR_HOST_URL=${SONAR_HOST_URL}"'
                    sh """$SONAR_SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectKey=World-Countries-Project \
                        -Dsonar.sources=app.js \
                        -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info \
                        -Dsonar.host.url=$SONAR_HOST_URL"""
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'printenv'
                sh 'docker build -t chahatyadav1/world-countries:$GIT_COMMIT .'
            }
        }

        stage('Trivy Vulnerability Scanner') {
            steps {
                sh '''
                    trivy image chahatyadav1/world-countries:$GIT_COMMIT \
                        --severity LOW,MEDIUM,HIGH \
                        --exit-code 0 \
                        --format json -o trivy-image-MEDIUM-results.json

                    trivy image chahatyadav1/world-countries:$GIT_COMMIT \
                        --severity CRITICAL \
                        --exit-code 1 \
                        --format json -o trivy-image-CRITICAL-results.json
                '''
            }
            post {
                always {
                    sh '''
                        trivy convert --format template --template "@./trivy-templates/html.tpl" \
                        --output trivy-image-MEDIUM-results.html trivy-image-MEDIUM-results.json

                        trivy convert --format template --template "@./trivy-templates/html.tpl" \
                        --output trivy-image-CRITICAL-results.html trivy-image-CRITICAL-results.json

                        trivy convert --format template --template "@./trivy-templates/junit.tpl" \
                        --output trivy-image-MEDIUM-results.xml trivy-image-MEDIUM-results.json

                        trivy convert --format template --template "@./trivy-templates/junit.tpl" \
                        --output trivy-image-CRITICAL-results.xml trivy-image-CRITICAL-results.json
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push chahatyadav1/world-countries:$GIT_COMMIT
                    '''
                }
            }
        }

        stage('Deploy - AWS EC2') {
            when { branch 'feature/*' }
            steps {
                sh 'sleep 5s'
            }
        }

        stage('Integration Testing - AWS EC2') {
            when { branch 'feature/*' }
            steps {
                sh 'printenv | grep -i branch'
                withAWS(credentials: 'aws-s3-ec2-lambda-creds', region: 'us-east-2') {
                    sh 'bash integration-testing-ec2.sh'
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results.xml'
            junit allowEmptyResults: true, testResults: 'dependency-check-junit.xml'
            junit allowEmptyResults: true, testResults: 'trivy-image-CRITICAL-results.xml'
            junit allowEmptyResults: true, testResults: 'trivy-image-MEDIUM-results.xml'
        }
    }
}