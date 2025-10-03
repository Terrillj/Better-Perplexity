/**
 * BM25 scorer for document relevance
 * Uses standard parameters: k1=1.5, b=0.75
 * 
 * BM25 formula: sum over query terms of IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
 * where:
 *   - IDF(qi) = log((N - n(qi) + 0.5) / (n(qi) + 0.5))
 *   - f(qi, D) = frequency of term qi in document D
 *   - |D| = length of document D
 *   - avgdl = average document length in corpus
 *   - N = total number of documents
 *   - n(qi) = number of documents containing qi
 */
export class BM25Scorer {
  private tokenizedDocs: string[][];
  private idf: Map<string, number>;
  private avgDocLength: number;
  private k1: number = 1.5;
  private b: number = 0.75;
  
  constructor(documents: string[]) {
    // Tokenize documents
    this.tokenizedDocs = documents.map(doc => 
      this.tokenize(doc)
    );
    
    // Calculate average document length
    const totalLength = this.tokenizedDocs.reduce((sum, doc) => sum + doc.length, 0);
    this.avgDocLength = totalLength / this.tokenizedDocs.length || 1;
    
    // Calculate IDF for all terms
    this.idf = this.calculateIDF();
  }
  
  private tokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  }
  
  private calculateIDF(): Map<string, number> {
    const idf = new Map<string, number>();
    const N = this.tokenizedDocs.length;
    
    // Count document frequency for each term
    const termDocCount = new Map<string, number>();
    for (const doc of this.tokenizedDocs) {
      const uniqueTerms = new Set(doc);
      for (const term of uniqueTerms) {
        termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
      }
    }
    
    // Calculate IDF for each term
    for (const [term, docCount] of termDocCount) {
      const idfValue = Math.log((N - docCount + 0.5) / (docCount + 0.5) + 1);
      idf.set(term, idfValue);
    }
    
    return idf;
  }
  
  /**
   * Score a query against a specific document
   * @param query - Search query
   * @param docIndex - Index of document to score
   * @returns BM25 score (0-1 normalized)
   */
  score(query: string, docIndex: number): number {
    const queryTerms = this.tokenize(query);
    const doc = this.tokenizedDocs[docIndex];
    const docLength = doc.length;
    
    // Calculate term frequencies in document
    const termFreq = new Map<string, number>();
    for (const term of doc) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }
    
    // Calculate BM25 score
    let score = 0;
    for (const term of queryTerms) {
      const idfValue = this.idf.get(term) || 0;
      const freq = termFreq.get(term) || 0;
      
      const numerator = freq * (this.k1 + 1);
      const denominator = freq + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
      
      score += idfValue * (numerator / denominator);
    }
    
    // Normalize to 0-1 range (BM25 scores are unbounded)
    // Typical max score is ~10-15 for good matches
    return Math.min(score / 10, 1.0);
  }
}

