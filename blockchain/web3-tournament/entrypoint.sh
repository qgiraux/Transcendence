
#Compile Contract
##Update solc_input content
cp /solc_input.json /tmp/.
cat /tmp/solc_input.json | jq '.sources.TournamentScores.content="'"$(cat /TournamentScores.sol | sed -r 's/\\/\\\\/g' | sed -r 's/"/\\"/g')"'"' > /solc_input.json
rm /tmp/solc_input.json
##solc
solc --standard-json solc_input.json > solc_output.json

#Database
python3 /django/manage.py makemigrations w3App
python3 /django/manage.py migrate w3App

exec "$@"
