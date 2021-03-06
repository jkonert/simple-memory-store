/** module for providing a simple interface to a kind of database (only in memory)
 *  objects stored are identified by .id attribute, which is automatically set and incremented (starting with 100) over
 *  all collections (called types). On insert operation .id must not be set (and will be added by the insert method).
 *  This simple-memory-store is not intended to be used for production use, but only for training or lecture purposes!
 *
 *  @description
 *  primary methods exposed as public:
 *  - select (String type, Number id) [@returns undefined, one element or array of elements]
 *  - insert (String type, Object element) [@returns the new element as a copy with set .id attribute]
 *  - replace (String type, Number id, Object element) [@returns the former object stored before]
 *  - remove (String type, Number id) [@returns the former object stored before]
 *
 *  All methods throw Errors if something went wrong.
 *  Elements stored in store are expected to have an .id property with a numeric value > 0 (except on insert(..))
 @author Johannes Konert
 @licence  CC BY-SA 4.0
 @version 1.0
 @requires es6 interpreter
 @fires Error in methods if something went wrong
 */
"use strict";


// our "in memory database" is a simple object!
let memory = {};

//** private helper functions */

/** a generator function for ID generation. Use .next() for next ID
 * @returns {function} the next() function of the generator inside. Use the function().value for the next number
 */
 let nextID = (function () {
    let myCounter =   (function* () {  // calls a anonymous generator function yielding new values on each next()...
        let i = 100;
        while (true) {
            yield ++i;
        }
    })();
    // return a function that calls next() and gives the value
    return () => { return myCounter.next().value };
 })();


/**
 *  Checks given element for being an object
 * @param element
 * @throws Error if not an object
 */
function checkElement(element) {
    if (typeof(element) !== 'object') {
        throw new Error('Element is not an object to store', element);
    }
}

/**
 * Returns a deep clone of object attributes (no functions)
 * Uses JSON.stringify for this.
 * @param object to copy
 * @returns {object}
 */
function getDeepObjectCopy(object) {
    if (!object) return undefined;
    return JSON.parse(JSON.stringify(object)); // quick&dirty solution to deep copy a data object (without functions!)
}

//********** the public class ********************
class Store {
    constructor() {
        Store.prototype.instance = Store.prototype.instance || this;
        return this.instance;
    }

    /** Selects all of one specific element from a given type list
     *
     * @param [string} type - the String identifier of the DB table
     * @param {string, number} [id] - (optional) Number ID of element to select only one
     * @returns {[],{}, undefined} - undefined if nothing found, array of objects or one object only if ID was given
     */
    select(type, id) {
        let list = memory[type];
        id = parseInt(id);
        list =  (list == undefined || list.length === 0)? undefined: list; // prevent []
        if (list != undefined && list.length > 0 && !isNaN(id)) {
            list = list.filter(function(element) {
                return element.id === id;
            });
            list =  (list.length === 0)? undefined: list[0]; // only return the 1 found element; prevent empty []
        }
        return getDeepObjectCopy(list); // may contain undefined, object or array;
    }


    /** Inserts an element into the list of type and adds an .id to it
     *
     * @param {string} - type (e.g. collections name like "tweets")
     * @param {object} - element (without an .id property)
     * @returns {object} - the stored copy of the given element (with new .id attribute)
     */
    insert(type, element) {
        checkElement(element);
        if (element.id !== undefined) {
            throw new Error("element already has an .id value, but should not on insert!");
        }
        if (!type || typeof type !== "string") {
            throw new Error("type is not a valid string to be used as a collection type: "+ type);
        }
        element = getDeepObjectCopy(element);
        element.id = nextID();
        console.log(element.id);
        memory[type] = memory[type] || [];
        memory[type].push(element);
        return element;
    }


    /** Replaces an existing element. id and newElement.id must be identical
     *
     * @param {string} type
     * @param {string, Number} id - id to be replaced
     * @param {object} newElement - needs to have .id property of same value as id
     * @throws Error in case element cannot be found or id and .id are not the same
     * @returns {object} the element that was stored before (old value)
     */
    replace(type, id, newElement) {
        checkElement(newElement);
        let found = this.select(type, id);
        if (found === undefined) {
            throw new Error('element with id '+id+' does not exist in store type '+type, newElement);
        }
        if (newElement.id !== found.id) {
            throw new Error("element.id and given id are not identical! Cannot replace");
        }
        // now get the index of the element
        const index = memory[type].findIndex((item) => (item.id === found.id));
        // case of index = null cannot happen as it was found before..
        newElement.id = found.id; // for type safety
        newElement = getDeepObjectCopy(newElement);
        memory[type][index] = newElement;
        return found;
    }


    /** Removes an element of given id from the store
     *
     * @param {string} type
     * @param {String, Number} id - numerical id of element to remove
     * @throws Error if element cannot be found in store
     * @returns {object} element that was in the store
     */
    remove(type, id) {
        const found = store.select(type, id);
        if (found === undefined) {
            throw new Error('element with id '+id+' does not exist in store type '+type);
        }
        id = found.id;
        // now get the index of the element
        const index = memory[type].findIndex((item) => (item.id === found.id));
        // and splice it out
        memory[type].splice(index, 1);
        return found;
    }

    /**
     * Initializes the store memory with some default data (tweets and users).
     * @returns {object} the store instance itself
     */
    initWithDefaultData(){
        if (memory.hasOwnProperty('tweets')) {
            throw new Error('Cannot init with default tweets and users because Store memory is not empty!');
        }
        this.reset(true);
        // some default store content
        let ids = [nextID(),nextID(),nextID(),nextID()];
        memory.tweets = [
            {   id: ids[0],
                message: "Hello world tweet",
                timestamp: new Date().getTime(),
                user: {
                    id: ids[2]
                }
            },
            {   id: ids[1],
                message: "Another nice tweet",
                timestamp: new Date().getTime(),
                user: {
                    id: ids[3]
                }
            }
        ];
        memory.users = [
            {   id: ids[2],
                firstname: "Super",
                lastname: "Woman"
            },
            {   id: ids[3],
                firstname: "Jane",
                lastname: "Doe"
            }
        ];
        return this;
    }

    /**
     * WARNING: only call if you want to reset (remove all) data in the store
     * @param {Boolean} [really] - must be set true to really delete all entries
     * @returns {object} the store instance itself
     */
    reset(really = false) {
        if (!really) return;
        memory = {};
        return this;
    }
}
// CommonJS export for node.js "require(..)" to work
module.exports = Store; // let require use the store class