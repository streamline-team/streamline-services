PACKAGE="streamline-service"

docker build -f docker/service/Dockerfile -t $PACKAGE .

gcloud auth print-access-token | docker login \
    -u oauth2accesstoken \
    --password-stdin https://europe-west2-docker.pkg.dev

docker tag $PACKAGE europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE

docker push europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE

gcloud run deploy $PACKAGE \
    --quiet \
    --image europe-west2-docker.pkg.dev/$GCLOUD_PROJECT/cloud-run/$PACKAGE \
    --platform managed \
    --vpc-connector=projects/$GCLOUD_PROJECT/locations/europe-west2/connectors/vpc-connector-01 \
    --vpc-egress=all-traffic \
    --service-account=cloud-run@$GCLOUD_PROJECT.iam.gserviceaccount.com \
    --region europe-west2 \
    --min-instances 0 \
    --update-env-vars "DB_USER=$DB_USER,DB_HOST=$DB_HOST,DB_PASSWORD=u=RmnDZc46aQ3E9,APP_ENV=prod"