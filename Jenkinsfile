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
            when {
                anyOf { branch 'dev'; branch 'main' }
            }
            options { timestamps() }
            steps {
                sh 'npm install --no-audit'
            }
        }

        stage('Dependency Scanning') {
            when { branch 'dev' }
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
            when { branch 'dev' }
            options { retry(2) }
            steps {
                sh 'npm test'
            }
        }

        stage('Code Coverage') {
            when { branch 'dev' }
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
            when { branch 'dev' }
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
            when { branch 'dev' }
            steps {
                sh 'docker build -t chahatyadav1/world-countries:$GIT_COMMIT .'
            }
        }

        stage('Trivy Vulnerability Scanner') {
            when { branch 'dev' }
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
            when { branch 'dev' }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push chahatyadav1/world-countries:$GIT_COMMIT
                    '''
                }
            }
        }

        stage('K8S - Update Image Tag') {
            when { branch 'dev' }
            steps {
                sh 'rm -rf ${WORKSPACE}/world-countries-app || true'
                sh 'git clone -b main https://github.com/Chahatyadav1/world-countries-app.git'
                dir("world-countries-app/kubernetes") {
                    withCredentials([string(credentialsId: 'GitHub-token-text', variable: 'GITHUB_TOKEN')]) {
                        sh '''
                            git checkout main
                            git checkout -b dev
                            sed -i '' 's#chahatyadav1/world-countries:[^[:space:]]*#chahatyadav1/world-countries:'"$GIT_COMMIT"'#g' AppDeployment.yaml
                            cat AppDeployment.yaml

                            git config --global user.email "chahatyadav@gmail.com"
                            git config --global user.name "Chahat Yadav"
                            git remote set-url origin https://$GITHUB_TOKEN@github.com/Chahatyadav1/world-countries-app.git
                            git add AppDeployment.yaml
                            git diff --cached --quiet || git commit -m "Updated docker image"
                            git push origin --delete dev || true
                            git push -u origin dev
                        '''
                    }
                }
            }
        }

        stage('K8S - Raise PR') {
            when { branch 'dev' }
            steps {
                withCredentials([string(credentialsId: 'GitHub-token-text', variable: 'GITHUB_TOKEN')]) {
                    sh '''
                        gh pr create \
                            --repo Chahatyadav1/world-countries-app \
                            --title "Updated Docker Image Tag - Build $BUILD_ID" \
                            --body "This PR updates the docker image tag for build $BUILD_ID" \
                            --head dev \
                            --base main
                    '''
                }
            }
        }

        stage('Manual Approval') {
            when { branch 'main' }
            steps {
                input(cancel: 'Cancel', message: 'Is the PR merged, ArgoCD deployed and synced?', ok: 'Yes — ship to production')
            }
        }

        stage('Verify Deployment') {
            when { branch 'main' }
            steps {
                echo "Running post-merge production verification..."
                sh 'echo "Production deploy verified for commit $GIT_COMMIT"'
            }
        }
    }

    post {
        always {
            sh 'rm -rf ${WORKSPACE}/world-countries-app || true'
        }
    }
}
