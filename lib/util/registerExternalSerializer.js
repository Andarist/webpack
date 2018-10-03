/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const ObjectMiddleware = require("../serialization/ObjectMiddleware");

const CachedSource = require("webpack-sources").CachedSource;
const RawSource = require("webpack-sources").RawSource;
const OriginalSource = require("webpack-sources").OriginalSource;
const SourceMapSource = require("webpack-sources").SourceMapSource;
const SourceLocation = require("acorn").SourceLocation;

const CURRENT_MODULE = "webpack/lib/util/registerExternalSerializer";

ObjectMiddleware.register(
	CachedSource,
	CURRENT_MODULE,
	"webpack-sources/CachedSource",
	new class CachedSourceSerializer {
		/**
		 * @param {CachedSource} source the cached source to be serialized
		 * @param {ObjectMiddleware.ObjectSerializerContext} context context
		 * @returns {void}
		 */
		serialize(source, { write }) {
			const data = source.sourceAndMap({});
			write(data.source);
			write(JSON.stringify(data.map));
		}

		/**
		 * @param {ObjectMiddleware.ObjectDeserializerContext} context context
		 * @returns {CachedSource}
		 */
		deserialize({ read }) {
			const source = read();
			const map = read();
			return new CachedSource(new SourceMapSource(source, "unknown", map));
		}
	}()
);

ObjectMiddleware.register(
	RawSource,
	CURRENT_MODULE,
	"webpack-sources/RawSource",
	new class RawSourceSerializer {
		/**
		 * @param {RawSource} source the raw source to be serialized
		 * @param {ObjectMiddleware.ObjectSerializerContext} context context
		 * @returns {void}
		 */
		serialize(source, { write }) {
			const data = source.source();
			write(data);
		}

		/**
		 * @param {ObjectMiddleware.ObjectDeserializerContext} context context
		 * @returns {RawSource}
		 */
		deserialize({ read }) {
			const source = read();
			return new RawSource(source);
		}
	}()
);

ObjectMiddleware.register(
	OriginalSource,
	CURRENT_MODULE,
	"webpack-sources/OriginalSource",
	new class OriginalSourceSerializer {
		/**
		 * @param {OriginalSource} source the original source to be serialized
		 * @param {ObjectMiddleware.ObjectSerializerContext} context context
		 * @returns {void}
		 */
		serialize(source, { write }) {
			write(source.source());
			write(source._name);
		}

		/**
		 * @param {ObjectMiddleware.ObjectDeserializerContext} context context
		 * @returns {OriginalSource}
		 */
		deserialize({ read }) {
			return new OriginalSource(read(), read());
		}
	}()
);

ObjectMiddleware.register(
	SourceLocation,
	CURRENT_MODULE,
	"acorn/SourceLocation",
	new class SourceLocationSerializer {
		/**
		 * @param {SourceLocation} loc the location to be serialized
		 * @param {ObjectMiddleware.ObjectSerializerContext} context context
		 * @returns {void}
		 */
		serialize(loc, { write }) {
			write(loc.start.line);
			write(loc.start.column);
			write(loc.end.line);
			write(loc.end.column);
		}

		/**
		 * @param {ObjectMiddleware.ObjectDeserializerContext} context context
		 * @returns {import("../Dependency").RealDependencyLocation}
		 */
		deserialize({ read }) {
			return {
				start: {
					line: read(),
					column: read()
				},
				end: {
					line: read(),
					column: read()
				}
			};
		}
	}()
);
