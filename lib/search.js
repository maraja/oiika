//Search class -- where all the search login happens!
class Search {
	constructor(req, res, next) {
		this.req = req;
		this.res = res;
		this.next = req;
	}

	map() {
		console.log("hello");

		this.next();
	}
}