PACKAGE="streamline-service"

docker build -f docker/service/Dockerfile --platform linux/amd64 -t $PACKAGE .

gcloud auth print-access-token | docker login \
    -u oauth2accesstoken \
    --password-stdin https://europe-west2-docker.pkg.dev

# Shouldn't be needed:
# cat .gcloud-service.json | docker login -u _json_key --password-stdin https://europe-west2-docker.pkg.dev

docker tag $PACKAGE europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE

docker push europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE

# CLOUDSDK_CORE_DISABLE_PROMPTS=1 ./google-cloud-sdk/install.sh --usage-reporting=false --quiet

# Shouldn't need this with identty provider
# ./google-cloud-sdk/bin/gcloud auth activate-service-account services-deployer@$GCLOUD_PROJECT.iam.gserviceaccount.com \
#     --key-file=.gcloud-service.json \
#     --project=$GCLOUD_PROJECT

gcloud run deploy $PACKAGE \
    --quiet \
    --image europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE \
    --platform managed \
    --vpc-connector=projects/$GCLOUD_PROJECT/locations/europe-west2/connectors/vpc-connector-01 \
    --vpc-egress=all-traffic \
    --service-account=cloud-run@$GCLOUD_PROJECT.iam.gserviceaccount.com \
    --add-cloudsql-instances=$GCLOUD_PROJECT:europe-west2:streamline  \
    --region europe-west2 \
    --min-instances 0 \
    --update-env-vars "DB_USER=$DB_USER,DB_HOST=$DB_HOST,DB_PASSWORD=$DB_PASSWORD,APP_ENV=prod"