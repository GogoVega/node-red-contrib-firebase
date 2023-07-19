/**
 * Copyright 2022-2023 Gauthier Dandele
 *
 * Licensed under the MIT License,
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NodeAPI } from "node-red";
import { OnDisconnect } from "../lib/onDisconnectNode";
import { InputMessageType } from "../lib/types/FirebaseNodeType";
import { OnDisconnectConfigType } from "../lib/types/OnDisconnectConfigType";
import { OnDisconnectNodeType } from "../lib/types/OnDisconnectNodeType";

module.exports = function (RED: NodeAPI) {
	function OnDisconnectNode(this: OnDisconnectNodeType, config: OnDisconnectConfigType) {
		RED.nodes.createNode(this, config);
		const self = this;

		const firebase = new OnDisconnect(self, config, RED);

		firebase.getDatabase();
		firebase.registerNode();
		firebase.setNodeStatus();
		firebase.setMsgSendHandler();

		self.on("input", (msg: InputMessageType, _send, done) => {
			firebase
				.setOnDisconnectQuery(msg)
				.then(() => done())
				.catch((error: Error) => self.onError(error, done));
		});

		self.on("close", (removed: boolean, done: () => void) => firebase.deregisterNode(removed, done));
	}

	RED.nodes.registerType("on-disconnect", OnDisconnectNode);
};
