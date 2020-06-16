class Database {
	prefix = '_localdb'
	
	_cache = {}
	
	_getDocumentData = path => {
		const data = localStorage.getItem(`${this.prefix}/${path}`)
		return data && JSON.parse(data)
	}
	
	_setDocumentData = (path, data) =>
		localStorage.setItem(`${this.prefix}/${path}`, JSON.stringify(data))
	
	_deleteDocument = path =>
		localStorage.removeItem(`${this.prefix}/${path}`)
	
	newId = () =>
		Math.random().toString(16).slice(2)
	
	collection = (path, parts) =>
		this._cache[path] || (
			this._cache[path] = new Collection(this, path, parts || path.split('/'))
		)
	
	doc = (path, parts) =>
		this._cache[path] || (
			this._cache[path] = new Document(this, path, parts || path.split('/'))
		)
}

class Collection {
	constructor(db, path, parts) {
		if (!(parts.length & 1))
			throw new Error('Collections must have an odd number of path parts')
		
		this.db = db
		
		this.id = parts[parts.length - 1]
		this.path = path
		this.parts = parts
	}
	
	doc = path => {
		const parts = [
			...this.parts,
			...path.split('/')
		]
		
		return this.db.doc(parts.join('/'), parts)
	}
	
	add = data => {
		if (typeof data !== 'object')
			throw new Error('"data" must be an object')
		
		return this.doc(this.db.newId()).set(data)
	}
}

class Document {
	_data = null
	_exists = null
	
	_onChangeHandlers = new Map()
	
	constructor(db, path, parts) {
		if (parts.length & 1)
			throw new Error('Documents must have an even number of path parts')
		
		this.db = db
		
		this.id = parts[parts.length - 1]
		this.path = path
		this.parts = parts
	}
	
	collection = path => {
		const parts = [
			...this.parts,
			...path.split('/')
		]
		
		return this.db.collection(parts.join('/'), parts)
	}
	
	get data() {
		if (this._data || this._exists === false)
			return this._data
		
		this._data = this.db._getDocumentData(this.path)
		this._exists = Boolean(this._data)
		
		return this._data
	}
	
	get exists() {
		if (this._exists === null) {
			this._data = this.db._getDocumentData(this.path)
			this._exists = Boolean(this._data)
		}
		
		return this._exists
	}
	
	set = data => {
		if (typeof data !== 'object')
			throw new Error('"data" must be an object')
		
		this._data = data
		this._exists = true
		
		this._callOnChangeHandlers('set')
		this.db._setDocumentData(this.path, data)
		
		return this
	}
	
	update = data => {
		if (!data)
			throw new Error('"data" must be an object')
		
		this._data = {
			...this.data(),
			...data
		}
		this._exists = true
		
		this._callOnChangeHandlers('update')
		this.db._setDocumentData(this.path, this._data)
		
		return this
	}
	
	delete = () => {
		this._data = null
		this._exists = false
		
		this._callOnChangeHandlers('delete')
		this.db._deleteDocument(this.path)
		
		return this
	}
	
	_callOnChangeHandlers = action =>
		this._onChangeHandlers.forEach((_, handler) =>
			handler(this, action)
		)
	
	onChange = (handler, initial = true) => {
		if (initial)
			handler(this, null)
		
		this._onChangeHandlers.set(handler, true)
		
		return () => {
			this._onChangeHandlers.delete(handler)
		}
	}
}

window.db = new Database()
