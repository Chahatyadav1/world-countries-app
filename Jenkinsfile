pipeline {
    agent any

    tools {
        nodejs 'nodejs-24-14-0'
        jdk 'jdk-21'
    }

    environment {
        MONGO_URI          = "mongodb+srv://supercluster.d83jj.mongodb.net/superData"
        MONGO_DB_CREDS     = credentials('mongo-db-credentials')
        MONGO_USERNAME  = credentials('mongouser')
        MONGO_PASSWORD  = credentials('mongopassword')
        SONAR_SCANNER_HOME = tool 'sonarqube'
        DOCKER_USER =  credentials('docker-cli-user')
        DOCKER_PASS = credentials('docker-cli-pass')
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
                    sh """$SONAR_SCANNER_HOME/bin/sonar-scanner \\
                        -Dsonar.projectKey=World-Countries-Project \\
                        -Dsonar.sources=app.js \\
                        -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info \\
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
                        --download-db-only  \
                        --severity LOW,MEDIUM,HIGH \
                        --exit-code 0 \
                        --format json -o trivy-image-MEDIUM-results.json

                    trivy image chahatyadav1/world-countries:$GIT_COMMIT \
                        --download-db-only \
                        --severity CRITICAL \
                        --exit-code 1 \
                        --format json -o trivy-image-CRITICAL-results.json
                '''
            }
            post {
                always {
                    sh '''
                        trivy convert \
                            --format template --template "@./trivy-templates/html.tpl" \
                            --output trivy-image-MEDIUM-results.html trivy-image-MEDIUM-results.json

                        trivy convert \
                            --format template --template "@./trivy-templates/html.tpl" \
                            --output trivy-image-CRITICAL-results.html trivy-image-CRITICAL-results.json

                        trivy convert \
                            --format template --template "@./trivy-templates/junit.tpl" \
                            --output trivy-image-MEDIUM-results.xml trivy-image-MEDIUM-results.json

                        trivy convert \
                            --format template --template "@./trivy-templates/junit.tpl" \
                            --output trivy-image-CRITICAL-results.xml trivy-image-CRITICAL-results.json
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh ''' echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                       docker push chahatyadav1/world-countries:$GIT_COMMIT '''
                }
            }
        }

        stage('Deploy - AWS EC2') {
            when { branch 'feature/*' }
            steps {
                sh 'sleep 5s'
                // sshagent(['aws-dev-deploy-ec2-instance']) {
                //     sh '''ssh -o StrictHostKeyChecking=no ubuntu@<EC2-IP> "
                //         sudo docker stop world-countries || true
                //         sudo docker rm world-countries || true
                //         sudo docker run --name world-countries \
                //             -e MONGO_URI=$MONGO_URI \
                //             -e MONGO_USERNAME=$MONGO_USERNAME \
                //             -e MONGO_PASSWORD=$MONGO_PASSWORD \
                //             -p 3000:3000 -d chahatyadav1/world-countries:$GIT_COMMIT
                //     "'''
                // }
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

        stage('K8S - Update Image Tag') {
            when { branch 'PR*' }
            steps {
                sh 'git clone -b main http://<GITEA_IP>:5555/dasher-org/world-countries-gitops-argocd'
                dir("world-countries-gitops-argocd/kubernetes") {
                    sh '''
                        git checkout main
                        git checkout -b feature-$BUILD_ID
                        sed -i "s#yourrepo.*#yourrepo/world-countries:$GIT_COMMIT#g" deployment.yml
                        cat deployment.yml
                        git config --global user.email "jenkins@dasher.com"
                        git remote set-url origin http://$GITEA_TOKEN@<GITEA_IP>:5555/dasher-org/world-countries-gitops-argocd
                        git add .
                        git commit -am "Updated docker image"
                        git push -u origin feature-$BUILD_ID
                    '''
                }
            }
        }

        stage('K8S - Raise PR') {
            when { branch 'PR*' }
            steps {
                sh """
                    curl -X 'POST' \
                        'http://<GITEA_IP>:5555/api/v1/repos/dasher-org/world-countries-gitops-argocd/pulls' \
                        -H 'accept: application/json' \
                        -H 'Authorization: token $GITEA_TOKEN' \
                        -H 'Content-Type: application/json' \
                        -d '{
                            "assignee": "gitea-admin",
                            "assignees": ["gitea-admin"],
                            "base": "main",
                            "body": "Updated docker image in deployment manifest",
                            "head": "feature-$BUILD_ID",
                            "title": "Updated Docker Image"
                        }'
                """
            }
        }

        stage('App Deployed?') {
            when { branch 'PR*' }
            steps {
                timeout(time: 1, unit: 'DAYS') {
                    input message: 'Is the PR Merged and ArgoCD Synced?', ok: 'YES! PR is Merged and ArgoCD Application is Synced'
                }
            }
        }

        stage('DAST - OWASP ZAP') {
            when { branch 'PR*' }
            steps {
                sh '''
                    chmod 777 $(pwd)
                    docker run -v $(pwd):/zap/wrk/:rw ghcr.io/zaproxy/zaproxy zap-api-scan.py \
                        -t http://<K8S_NODE_IP>:30000/api-docs/ \
                        -f openapi \
                        -r zap_report.html \
                        -w zap_report.md \
                        -J zap_json_report.json \
                        -x zap_xml_report.xml \
                        -c zap_ignore_rules
                '''
            }
        }

        stage('Upload - AWS S3') {
            when { branch 'PR*' }
            steps {
                withAWS(credentials: 'aws-s3-ec2-lambda-creds', region: 'us-east-2') {
                    sh '''
                        ls -ltr
                        mkdir reports-$BUILD_ID
                        cp -rf coverage/ reports-$BUILD_ID/
                        cp dependency*.* test-results.xml trivy*.* zap*.* reports-$BUILD_ID/
                        ls -ltr reports-$BUILD_ID/
                    '''
                    s3Upload(
                        file: "reports-$BUILD_ID",
                        bucket: 'world-countries-jenkins-reports-bucket',
                        path: "jenkins-$BUILD_ID/"
                    )
                }
            }
        }

        stage('Deploy to Prod?') {
            when { branch 'main' }
            steps {
                timeout(time: 1, unit: 'DAYS') {
                    input message: 'Deploy to Production?', ok: 'YES! Let us deploy to Production', submitter: 'admin'
                }
            }
        }

        stage('Lambda - S3 Upload & Deploy') {
            when { branch 'main' }
            steps {
                withAWS(credentials: 'aws-s3-ec2-lambda-creds', region: 'us-east-2') {
                    sh '''
                        tail -5 app.js
                        sed -i "/^app\\.listen(3000/ s/^/\\/\\//g" app.js
                        sed -i "s/^module.exports = app;/\\/\\/module.exports = app;/g" app.js
                        sed -i "s|^//module.exports.handler|module.exports.handler|" app.js
                        tail -5 app.js
                    '''
                    sh '''
                        zip -qr world-countries-lambda-$BUILD_ID.zip app* package* index.html node*
                        ls -ltr world-countries-lambda-$BUILD_ID.zip
                    '''
                    s3Upload(
                        file: "world-countries-lambda-${BUILD_ID}.zip",
                        bucket: 'world-countries-lambda-bucket'
                    )
                    sh """
                        aws lambda update-function-configuration \
                            --function-name world-countries-function \
                            --environment '{"Variables":{"MONGO_USERNAME":"${MONGO_USERNAME}","MONGO_PASSWORD":"${MONGO_PASSWORD}","MONGO_URI":"${MONGO_URI}"}}'
                    """
                    sh '''
                        aws lambda update-function-code \
                            --function-name world-countries-function \
                            --s3-bucket world-countries-lambda-bucket \
                            --s3-key world-countries-lambda-$BUILD_ID.zip
                    '''
                }
            }
        }

        stage('Lambda - Invoke Function') {
            when { branch 'main' }
            steps {
                withAWS(credentials: 'aws-s3-ec2-lambda-creds', region: 'us-east-2') {
                    sh '''
                        sleep 30s
                        function_url_data=$(aws lambda get-function-url-config --function-name world-countries-function)
                        function_url=$(echo $function_url_data | jq -r '.FunctionUrl | sub("/$"; "")')
                        curl -Is $function_url/live | grep -i "200 OK"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                if (fileExists('world-countries-gitops-argocd')) {
                    sh 'rm -rf world-countries-gitops-argocd'
                }
            }

            junit allowEmptyResults: true, stdioRetention: '', testResults: 'test-results.xml'
            junit allowEmptyResults: true, stdioRetention: '', testResults: 'dependency-check-junit.xml'
            junit allowEmptyResults: true, stdioRetention: '', testResults: 'trivy-image-CRITICAL-results.xml'
            junit allowEmptyResults: true, stdioRetention: '', testResults: 'trivy-image-MEDIUM-results.xml'

            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true, reportDir: './', reportFiles: 'zap_report.html', reportName: 'DAST - OWASP ZAP Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true, reportDir: './', reportFiles: 'trivy-image-CRITICAL-results.html', reportName: 'Trivy Image Critical Vul Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true, reportDir: './', reportFiles: 'trivy-image-MEDIUM-results.html', reportName: 'Trivy Image Medium Vul Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true, reportDir: './', reportFiles: 'dependency-check-jenkins.html', reportName: 'Dependency Check HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code Coverage HTML Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}