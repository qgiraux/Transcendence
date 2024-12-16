volume_list=$(docker volume ls -qf dangling=true)
if [ ! -z "${volume_list}" ]
then
    echo "👨 Deleting the volumes $volume_list"
    docker volume rm $volume_list
fi
