class Database {
	_cache = {}
	
	_getDocumentData = path => {
		const data = localStorage.getItem(`_localdb/${path}`)
		return data && JSON.parse(data)
	}
	
	_setDocumentData = (path, data) =>
		localStorage.setItem(`_localdb/${path}`, JSON.stringify(data))
	
	_deleteDocument = path =>
		localStorage.removeItem(`_localdb/${path}`)
	
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
}

class Document {
	_collections = []
	_data = null
	_exists = null
	
	constructor(db, path, parts) {
		if (parts.length & 1)
			throw new Error('Documents must have an even number of path parts')
		
		this.db = db
		
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
		if (!data)
			throw new Error('"data" must be an object')
		
		this._data = data
		this._exists = true
		
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
		
		this.db._setDocumentData(this.path, this._data)
		
		return this
	}
	
	delete = () => {
		this._data = null
		this._exists = false
		
		this.db._deleteDocument(this.path)
		
		return this
	}
}

window.db = new Database()
