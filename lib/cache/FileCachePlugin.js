/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const path = require("path");
const mkdirp = require("mkdirp");
const createHash = require("../util/createHash");
const serializer = require("../util/serializer");

/** @typedef {import("webpack-sources").Source} Source */
/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

class FileCachePlugin {
	constructor(options) {
		this.options = options;
	}

	/**
	 * @param {Compiler} compiler Webpack compiler
	 * @returns {void}
	 */
	apply(compiler) {
		const cacheDirectory =
			this.options.cacheDirectory ||
			path.resolve(process.cwd(), "node_modules/.cache/webpack");
		const hashAlgorithm = this.options.hashAlgorithm || "md4";
		const warn = this.options.warn;
		const toHash = str => {
			const hash = createHash(hashAlgorithm);
			hash.update(str);
			return hash.digest("hex");
		};
		compiler.hooks.beforeCompile.tapAsync(
			"FileCachePlugin",
			(params, callback) => {
				mkdirp(cacheDirectory, callback);
			}
		);
		compiler.cache.hooks.storeModule.tapPromise(
			"FileCachePlugin",
			(identifier, module) => {
				const filename = path.join(
					cacheDirectory,
					toHash(identifier) + ".module.data"
				);
				return serializer.serializeToFile(module, filename).catch(err => {
					if (warn) {
						console.warn(`Caching failed for module ${identifier}: ${err}`);
					}
				});
			}
		);
		compiler.cache.hooks.getModule.tapPromise("FileCachePlugin", identifier => {
			const filename = path.join(
				cacheDirectory,
				toHash(identifier) + ".module.data"
			);
			return serializer.deserializeFromFile(filename).catch(err => {
				if (warn) {
					console.warn(
						`Restoring failed for module ${identifier}: ${err.stack}`
					);
				}
			});
		});
		compiler.cache.hooks.storeAsset.tapPromise(
			"FileCachePlugin",
			(identifier, hash, source) => {
				const filename = path.join(
					cacheDirectory,
					toHash(identifier) + ".asset.data"
				);
				return serializer
					.serializeToFile({ source, hash }, filename)
					.catch(err => {
						if (warn) {
							console.warn(`Caching failed for asset ${identifier}: ${err}`);
						}
					});
			}
		);
		compiler.cache.hooks.getAsset.tapPromise(
			"FileCachePlugin",
			(identifier, hash) => {
				const filename = path.join(
					cacheDirectory,
					toHash(identifier) + ".asset.data"
				);
				return serializer.deserializeFromFile(filename).then(
					cacheEntry => {
						if (cacheEntry !== undefined && cacheEntry.hash === hash) {
							return cacheEntry.source;
						}
					},
					err => {
						if (warn) {
							console.warn(`Restoring failed for asset ${identifier}: ${err}`);
						}
					}
				);
			}
		);
	}
}
module.exports = FileCachePlugin;
