import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Database } from "firebase/database";
import admin, { ServiceAccount } from "firebase-admin";
import { Node } from "node-red";
import DatabaseConfigType from "./DatabaseConfigType";
import { FirebaseNodeType } from "./FirebaseNodeType";

export enum ConnectionStatus {
	DISCONNECTED,
	CONNECTING,
	CONNECTED,
	NO_NETWORK,
	ERROR,
}

type DatabaseCredentials = {
	apiKey: string;
	email: string;
	json: string;
	password: string;
	url: string;
	secret: string;
};

type DatabaseNodeType = Node & {
	app?: FirebaseApp | admin.app.App;
	auth?: Auth | admin.auth.Auth;
	connectionStatus: ConnectionStatus;
	config: DatabaseConfigType;
	credentials: DatabaseCredentials;
	database?: Database | admin.database.Database;
	nodes: Array<FirebaseNodeType>;
};

type JSONContentType = ServiceAccount & {
	project_id?: string;
	client_email?: string;
	private_key?: string;
};

export { DatabaseNodeType, JSONContentType };
