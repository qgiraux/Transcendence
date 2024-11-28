#exec "$@"
##################

SHARED_FOLDER="/data/"
ADDRESSES_JSON="$SHARED_FOLDER"/addresses.json
KEYSTORE="$HOME/.ethereum/keystore/"
GENESIS="/genesis.json"
ADD0="0000000000000000000000000000000000000001"
ADD0_B="0xf0000000000000000000000"
ADD1="0000000000000000000000000000000000000002"
ADD1_B="0xf0000000000000000000000"

#Imports a private key into a new account
_import_account(){
	local pass="$1"
	local key="$2"

	if [ -z "$pass" ] || [ -z "$key" ]; then
		return 1
	fi
	echo "_import_account: importing account $key ..."
	echo $pass > /tmp/pass \
		&& echo $key > /tmp/private_key \
		&& geth account import --password /tmp/pass /tmp/private_key \
		&& rm -f /tmp/pass /tmp/private_key \
		&& echo "_import_account: import success" \
		&& return 0
	echo "_import_account: import failed"
	rm -f /tmp/pass /tmp/private_key
	return 1
}

_create_account(){
	local pass="$1"

	if [ -z "$pass" ]; then
		echo "_create_account: failure"
		return 1
	fi
	echo "_create_account: creating new account ..."
	echo $pass > /tmp/pass \
		&& echo $key > /tmp/private_key \
		&& env -i geth account new --password /tmp/pass /tmp/private_key \
		&& rm -f /tmp/pass /tmp/private_key \
		&& echo "_create_account: success" \
		&& return 0
	echo "_create_account: failure"
	rm -f /tmp/pass /tmp/private_key
	return 1
}

_get_last_account_address_inquotes(){
	local file=$(ls "${KEYSTORE}" | sort | awk '//{row=$0} END{print row}')

	cat "$KEYSTORE/$file" | jq '.address'
}

_update_genesis(){
	local json_key=".alloc.[\"$1\"]"
	local address_val="$2" #in quotes

	if [ -z "$json_key" ] || [ -z "$address_val" ]; then
		echo "_update_genesis: failure"
		return 1
	fi
	echo "_update_genesis: replacing $json_key with new public address $address_val"
	cp "$GENESIS" /tmp/genesis.json
	cat /tmp/genesis.json \
		| jq '.alloc.['"$address_val"']='"$json_key"' 
				| del('"$json_key"')' \
			> "$GENESIS" \
		&& echo "_update_genesis: success" \
		&& return 0
	echo "_update_genesis: failure"
	return 1
}

_add_funded_node(){
	local pass="$1"
	local old_add="$2"

	if [ -z "$pass" ] || [ -z "$old_add" ]; then
		echo "_add_funded_node: failure"
		return 1
	fi
	_create_account "$pass"
	local address_val=$(_get_last_account_address_inquotes)

	_update_genesis "$old_add" "$address_val"
	# Communicates wallets
	cat "$ADDRESSES_JSON"
	cat "$ADDRESSES_JSON" | jq '.addresses |= . + ['"$address_val"']' > /tmp/addresses.json
	cat /tmp/addresses.json > "$ADDRESSES_JSON"
}

_create_genesis(){
	env -i geth --dev dumpgenesis > /tmp/genesis.json
	cat /tmp/genesis.json \
		| jq \
			'del(.alloc) | 
			.alloc.["'$ADD0'"].balance="'$ADD0_B'" | 
			.alloc.["'$ADD1'"].balance="'$ADD1_B'" | 
			.config.chainId='"$GETH_NETWORKID" \
		| cat > $GENESIS
	#echo "_create_genesis: generated $GENESIS:"
	#cat $GENESIS | jq
}

#Genesis
_create_genesis

# Communicates wallets
echo '{"addresses":[]}' | jq > "$ADDRESSES_JSON"

#Accounts
mkdir "$SHARED_FOLDER/keystore"
_add_funded_node "$ACC0_PASSWORD" "$ADD0"
_add_funded_node "$ACC1_PASSWORD" "$ADD1"
cp -r "$KEYSTORE" "$SHARED_FOLDER"

echo "Updated genesis:"
cat $GENESIS | jq

#Node
geth init $GENESIS \
	&& rm -f ~/.ethereum/geth/nodekey \
	&& echo ${BOOTNODE_PASS} > ${GETH_PASSWORD} \
	&& geth account new #--password ${GETH_PASSWORD}
rm -f ${GETH_PASSWORD}

#geth --nodekeyhex=${GETH_NODEKEYHEX} --nodiscover --ipcdisable --networkid=${GETH_NETWORKID} --netrestrict="${GETH_NETRESTRICT}"
#geth --nodekeyhex="37d571faed3af03f8302e1ddb940ca2f13010a1acf9443ba1507b93e5b36fcbd" --nodiscover --ipcdisable --networkid=${TESTNET_ID} --netrestrict="172.16.254.0/28"

exec "$@"
