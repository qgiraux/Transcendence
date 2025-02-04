#
make down
docker volume rm $(docker volume ls)
make
#

_userA="jerperez"
_userB="nritalo"
_passwordOK=Password123!
_wait_time_gnome=30

#
cd cli/

#TEST VERSION
node pong-cli --version

#wait for working server
sleep 5

#TEST SIGNUP A
_login=$_userA
_password=$_passwordOK
node pong-cli signup "--login=$_login" "--password=$_password" <<EOF
$_password
EOF

#TEST SIGNUP B
_login=$_userB
_password=$_passwordOK
node pong-cli signup "--login=$_login" "--password=$_password" <<EOF
$_password
EOF

#TEST CHAT
_login=$_userA
_password=$_passwordOK
gnome-terminal -- bash -c "sleep $_wait_time_gnome | node pong-cli chat --login=$_login --password=$_password <<EOF
coucou from $_login
!exit
EOF
"

_login=$_userB
_password=$_passwordOK
gnome-terminal -- bash -c "sleep $_wait_time_gnome | node pong-cli chat --login=$_login --password=$_password <<EOF
coucou from $_login
!exit
EOF
"

sleep 1

#TEST 1v1
_create_dt=0.5
_join_dt=0.5

_login=$_userA
_password=$_passwordOK
_tournament=patate
gnome-terminal -- bash -c "(sleep $_join_dt && echo ' ' && sleep 10) | node pong-cli game --login=$_login --password=$_password --width=30 --height=20 --create --tournament=$_tournament"

_login=$_userB
_password=$_passwordOK
_tournament=patate
gnome-terminal -- bash -c "(sleep $_create_dt && sleep $_join_dt && echo ' ' && sleep 10) | node pong-cli game --login=$_login --width=30 --height=20 --password=$_password --tournament=$_tournament"

