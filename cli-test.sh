PASSWORD=Password123!
LINE_BREAK=_____________________________________________
user_list=""
player_num=0
tournament_name=""

make_server () {
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
    gnome-terminal -- bash -c "node pong-cli test --login=$_login --password=$_password --tournament=$tournament_name"
}

create_tournament () {
    _login=$1
    _password=$PASSWORD
    _players=$player_num
    gnome-terminal -- bash -c "node pong-cli test --login=$_login --password=$_password --tournament=$tournament_name --create --players=$_players"
}

#

get_first_user () {
    get_user 0
}

get_other_users () {
    echo -e $user_list | awk '{if (1 != NR) {print $0}}'
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
    user_list+="$user\n"
}

get_user () {
    index=$1
    echo -e $user_list | awk '{if (NR - 1 == '$index') {print $0; exit}}'
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
    for _user in $(echo -e $user_list);
    do
        echo "$_user registers"
        register_user $_user
    done
    echo $LINE_BREAK
}

play_tournament () {
    echo_step "TOURNAMENT"
    _user=$(get_first_user)
    echo "$_user creates $tournament_name"
    create_tournament $(get_first_user)
    sleep 1 #
    for _user in $(get_other_users);
    do
        sleep 1 #
        echo "$_user joins $tournament_name"
        join_tournament $_user
    done
    echo $LINE_BREAK
}

##############################################################

player_num=2
tournament_name=$(get_unique_name_once)
echo $tournament_name

# #
make_server

cd cli

add_unique_users $player_num

register_users
play_tournament
