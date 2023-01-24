import { NodeAPI } from "node-red";
import FirebaseDatabase from "../lib/databaseNode";
import DatabaseConfigType from "../lib/types/DatabaseConfigType";
import { DatabaseNodeType } from "../lib/types/DatabaseNodeType";

module.exports = function (RED: NodeAPI) {
	function DatabaseNode(this: DatabaseNodeType, config: DatabaseConfigType) {
		RED.nodes.createNode(this, config);
		const self = this;

		self.connectionStatus = 0;
		self.config = config;
		self.nodes = [];

		const database = new FirebaseDatabase(self);

		database.logIn().catch((error: Error) => database.onError(error));

		self.on("close", (done: (error?: Error) => void) =>
			database
				.logOut()
				.then(() => done())
				.catch((error: Error) => done(error))
		);
	}

	RED.nodes.registerType("database-config", DatabaseNode, {
		credentials: {
			apiKey: { type: "text" },
			email: { type: "text" },
			json: { type: "password" },
			password: { type: "password" },
			secret: { type: "password" },
			url: { type: "text" },
		},
	});
};
