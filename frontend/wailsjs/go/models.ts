export namespace main {
	
	export class Config {
	    lastOpenedFolder: string;
	    lastOpenedFile: string;
	    expandedFolders: string[];
	    viewMode: string;
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lastOpenedFolder = source["lastOpenedFolder"];
	        this.lastOpenedFile = source["lastOpenedFile"];
	        this.expandedFolders = source["expandedFolders"];
	        this.viewMode = source["viewMode"];
	        this.theme = source["theme"];
	    }
	}
	export class DiffResult {
	    linesAdded: number;
	    linesRemoved: number;
	    linesModified: number;
	    charsAdded: number;
	    charsRemoved: number;
	    wordsAdded: number;
	    wordsRemoved: number;
	    totalLines: number;
	    totalChars: number;
	    totalWords: number;
	    diffContent?: string;
	
	    static createFrom(source: any = {}) {
	        return new DiffResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.linesAdded = source["linesAdded"];
	        this.linesRemoved = source["linesRemoved"];
	        this.linesModified = source["linesModified"];
	        this.charsAdded = source["charsAdded"];
	        this.charsRemoved = source["charsRemoved"];
	        this.wordsAdded = source["wordsAdded"];
	        this.wordsRemoved = source["wordsRemoved"];
	        this.totalLines = source["totalLines"];
	        this.totalChars = source["totalChars"];
	        this.totalWords = source["totalWords"];
	        this.diffContent = source["diffContent"];
	    }
	}
	export class FileItem {
	    name: string;
	    path: string;
	    isDir: boolean;
	    children?: FileItem[];
	
	    static createFrom(source: any = {}) {
	        return new FileItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDir = source["isDir"];
	        this.children = this.convertValues(source["children"], FileItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchResult {
	    path: string;
	    name: string;
	    isDir: boolean;
	    matchType: string;
	    matchText: string;
	    contextText: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.isDir = source["isDir"];
	        this.matchType = source["matchType"];
	        this.matchText = source["matchText"];
	        this.contextText = source["contextText"];
	    }
	}

}

