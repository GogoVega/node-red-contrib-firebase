import { NodeAPI } from "node-red";
import { FirebaseInNode } from "../lib/firebaseNode";
import { DatabaseNodeType } from "../lib/types/DatabaseNodeType";
import { FirebaseInConfigType, FirebaseInNodeType } from "../lib/types/FirebaseNodeType";

module.exports = function (RED: NodeAPI) {
	function FirebaseIn(this: FirebaseInNodeType, config: FirebaseInConfigType) {
		RED.nodes.createNode(this, config);
		const self = this;

		self.config = config;
		self.subscribed = false;
		self.database = RED.nodes.getNode(config.database) as DatabaseNodeType | null;

		if (!self.database) {
			self.error("Database not configured!");
			return;
		}

		self.database.nodes.push(self);

		try {
			const firebase = new FirebaseInNode(self);

			firebase.setNodeStatus();
			firebase.doSubscriptionQuery();

			self.on("close", () => {
				firebase.removeNodeStatus();
				firebase.doUnSubscriptionQuery();
			});
		} catch (error) {
			self.error(error);
		}
	}

	RED.nodes.registerType("firebase-in", FirebaseIn);
};
