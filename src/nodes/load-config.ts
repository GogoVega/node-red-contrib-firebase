/**
 * Copyright 2022-2024 Gauthier Dandele
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

import { ConfigNode } from "@gogovega/firebase-config-node/types";
import { NodeAPI } from "node-red";
import { join } from "node:path";
import { runUpdateDependencies, versionIsSatisfied } from "../migration/config-node";

/**
 * This fake node is used as:
 * An endpoint for nodes to request services from
 *   - Returns options to autocomplete the path field
 *   - Informs the editor about the config-node status
 *   - Run a command to update NR dependencies
 *
 * Hosted services such as FlowFuse do not use a file system - so it's not possible to run the Migrate script
 * from the runtime.
 */
module.exports = function (RED: NodeAPI) {
	let updateScriptCalled: boolean = false;

	// Check if the Config Node version satisfies the require one
	RED.httpAdmin.get("/firebase/rtdb/config-node/status", RED.auth.needsPermission("load-config.write"), (_req, res) => {
		res.json({
			status: {
				versionIsSatisfied: versionIsSatisfied(),
				updateScriptCalled: updateScriptCalled,
			},
		});
	});

	// Run the Update Script
	RED.httpAdmin.post(
		"/firebase/rtdb/config-node/scripts",
		RED.auth.needsPermission("load-config.write"),
		async (req, res) => {
			try {
				const scriptName = req.body.script;

				if (scriptName === "update-dependencies") {
					updateScriptCalled = true;

					// @node-red/util.exec is not exported, so it's a workaround to get it
					const utilPath = join(process.env.NODE_RED_HOME || ".", "node_modules", "@node-red/util");
					// eslint-disable-next-line @typescript-eslint/no-require-imports
					const exec = require(utilPath).exec;

					await runUpdateDependencies(RED, exec);
				} else {
					// Forbidden
					res.sendStatus(403);
					return;
				}

				res.json({ status: "success" });
			} catch (error) {
				res.json({
					status: "error",
					msg: error instanceof Error ? error.toString() : (error as Record<"stderr", string>).stderr,
				});
			}
		}
	);

	// Get autocomplete options
	RED.httpAdmin.get(
		"/firebase/rtdb/autocomplete/:id?",
		RED.auth.needsPermission("load-config.write"),
		async (req, res) => {
			const id = req.params.id as string | undefined;
			const path = req.query.path as string | undefined;

			if (!id) return res.status(400).send("The config-node ID is missing!");

			const node = RED.nodes.getNode(id) as ConfigNode | null;

			// Like database field not setted or new config-node not yet deployed
			if (!node) return res.json([]);

			const snapshot = await node.rtdb?.get(path);
			const data = snapshot ? snapshot.val() : {};
			const options = typeof data === "object" ? Object.keys(data ?? {}) : [];

			return res.json(options);
		}
	);
};
