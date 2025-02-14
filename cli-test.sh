PASSWORD=Password123!
PLAYER_NUM=2
########### DO NOT EDIT THIS ###########
########### SCRIPT AT BOTTOM ###########
LINE_BREAK=_____________________________________________
g_user_list=""
g_tournament_name=""

remake_server () {
    make down
    docker volume rm $(docker volume ls)
    make
    sleep 5
}

register_user () {
    _login=$1
    _password=$PASSWORD
node pong-cli signup "--login=$_login" "--password=$_password" <<EOF
$_password
EOF
}

join_tournament () {
    _login=$1
    _password=$PASSWORD
    gnome-terminal -- bash -c "node pong-cli test --login=$_login --password=$_password --tournament=$g_tournament_name"
}

create_tournament () {
    _login=$1
    _password=$PASSWORD
    _players=$PLAYER_NUM
    gnome-terminal -- bash -c "node pong-cli test --login=$_login --password=$_password --tournament=$g_tournament_name --create --players=$_players"
}

#

get_first_user () {
    get_user 0
}

get_other_users () {
    echo -e $g_user_list | awk '{if (1 != NR) {print $0}}'
}

echo_step () {
    echo $LINE_BREAK
    echo $1
    echo $LINE_BREAK
}

hex_to_username () {
    echo $1 | tr 0123456789 abcdefghij #TODO: maybe crop to last 15 chars
}

dec_to_hex () {
    echo "obase=16; $1" | bc
}

get_unique_name() {
    time_unique=$(dec_to_hex "$(date +%s)")
    index_unique=$(dec_to_hex "$1")
    hex_to_username "$time_unique$index_unique"
}

add_user () {
    user=$1
    g_user_list+="$user\n"
}

get_user () {
    index=$1
    echo -e $g_user_list | awk '{if (NR - 1 == '$index') {print $0; exit}}'
}

add_unique_users () {
    to_add=$1
    for i in $(seq 1 $to_add);
    do
        add_user "u$(get_unique_name $i)"
    done
}

get_unique_name_once () {
    echo "t$(get_unique_name 0)"
}

#
register_users () {
    echo_step "USERS SIGNUP"
    for _user in $(echo -e $g_user_list);
    do
        echo "$_user registers"
        register_user $_user
    done
    echo $LINE_BREAK
}

play_tournament () {
    echo_step "TOURNAMENT"
    _user=$(get_first_user)
    sleep 10 #
    echo "$_user creates $g_tournament_name"
    create_tournament $(get_first_user)
    sleep 10 #
    for _user in $(get_other_users);
    do
        sleep 1 #
        echo "$_user joins $g_tournament_name"
        join_tournament $_user
    done
    echo $LINE_BREAK
}

##############################################################

g_tournament_name=$(get_unique_name_once)

remake_server

cd cli

add_unique_users $PLAYER_NUM
sleep 10
register_users

play_tournament
