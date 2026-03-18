#!/bin/bash
echo "Integration test........"

aws --version

Data=$(aws ec2 describe-instances)
echo "Data - "$Data
URL=$(aws ec2 describe-instances | jq -r '.Reservations[].Instances[] | select(.Tags[].Value == "dev-deploy") | .PublicDnsName')
echo "URL Data - "$URL

if [[ "$URL" != '' ]]; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://$URL:3000/live)
        echo "http_code - "$http_code
    country_data=$(curl -s -XPOST http://$URL:3000/country -H "Content-Type: application/json" -d '{"id": "1"}')
        echo "country_data - "$country_data
    country_name=$(echo $country_data | jq .name -r)
        echo "country_name - "$country_name

    if [[ "$http_code" -eq 200 && "$country_name" == "India" ]];
        then
            echo "HTTP Status Code and Country Name Tests Passed"
        else
            echo "One or more test(s) failed"
            exit 1;
    fi;
else
        echo "Could not fetch a token/URL; Check/Debug line 8"
        exit 1;
fi;
