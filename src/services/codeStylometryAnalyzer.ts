import { CodeStylometryFeatures } from '../types';

export class CodeStylometryAnalyzer {
  
  // Analyze code for AI-generated patterns based on research paper insights
  analyzeCode(code: string, language: string = 'javascript'): CodeStylometryFeatures {
    const lines = code.split('\n');
    const trimmedLines = lines.filter(line => line.trim().length > 0);
    
    return {
      sessionId: '', // Will be set by caller
      lineCount: lines.length,
      characterCount: code.length,
      hasTernaryOperators: this.detectTernaryOperators(code, language),
      hasDirectReturns: this.detectDirectReturns(code, language),
      hasDuplicateExpressions: this.detectDuplicateExpressions(code),
      averageLineLength: this.calculateAverageLineLength(trimmedLines),
      commentRatio: this.calculateCommentRatio(lines, language),
      complexityScore: this.calculateComplexityScore(code, language),
      aiGeneratedProbability: this.calculateAIGeneratedProbability(code, language),
      perplexityScore: this.calculatePerplexityScore(code, language),
      structuralPatterns: this.analyzeStructuralPatterns(code, language)
    };
  }

  // Detect ternary operators (common in AI-generated code)
  private detectTernaryOperators(code: string, language: string): boolean {
    const patterns = {
      javascript: /\?.*:/g,
      python: /if.*else.*for.*in/g, // Python doesn't have ternary, but has similar patterns
      java: /\?.*:/g,
      cpp: /\?.*:/g
    };
    
    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    return pattern.test(code);
  }

  // Detect direct returns (common in AI-generated code)
  private detectDirectReturns(code: string, language: string): boolean {
    const patterns = {
      javascript: /return\s+[^;{]+;?$/gm,
      python: /return\s+[^:]+$/gm,
      java: /return\s+[^;{]+;?$/gm,
      cpp: /return\s+[^;{]+;?$/gm
    };
    
    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    const matches = code.match(pattern);
    return matches ? matches.length > 2 : false; // More than 2 direct returns is suspicious
  }

  // Detect duplicate expressions (AI tends to avoid this)
  private detectDuplicateExpressions(code: string): boolean {
    // Simple heuristic: look for repeated variable assignments or function calls
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const expressions = new Map<string, number>();
    
    for (const line of lines) {
      // Extract potential expressions (simplified)
      const cleanLine = line.replace(/\s+/g, ' ').trim();
      if (cleanLine.length > 10) { // Only consider substantial lines
        expressions.set(cleanLine, (expressions.get(cleanLine) || 0) + 1);
      }
    }
    
    // Check if any expression appears more than once
    for (const count of expressions.values()) {
      if (count > 1) return true;
    }
    
    return false;
  }

  // Calculate average line length
  private calculateAverageLineLength(lines: string[]): number {
    if (lines.length === 0) return 0;
    const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
    return totalLength / lines.length;
  }

  // Calculate comment ratio
  private calculateCommentRatio(lines: string[], language: string): number {
    if (lines.length === 0) return 0;
    
    const commentPatterns = {
      javascript: /^\s*\/\/|\/\*|\*\/|\* /,
      python: /^\s*#/,
      java: /^\s*\/\/|\/\*|\*\/|\* /,
      cpp: /^\s*\/\/|\/\*|\*\/|\* /
    };
    
    const pattern = commentPatterns[language as keyof typeof commentPatterns] || commentPatterns.javascript;
    const commentLines = lines.filter(line => pattern.test(line)).length;
    
    return commentLines / lines.length;
  }

  // Calculate code complexity score (simplified)
  private calculateComplexityScore(code: string, language: string): number {
    let complexity = 0;
    
    // Count control structures
    const controlPatterns = {
      javascript: /if\s*\(|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(/g,
      python: /if\s|for\s|while\s|try:|except\s/g,
      java: /if\s*\(|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(/g,
      cpp: /if\s*\(|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(/g
    };
    
    const pattern = controlPatterns[language as keyof typeof controlPatterns] || controlPatterns.javascript;
    const controlMatches = code.match(pattern);
    complexity += controlMatches ? controlMatches.length : 0;
    
    // Count nested structures (simplified)
    const nestingLevel = this.calculateNestingLevel(code);
    complexity += nestingLevel * 2;
    
    // Count function definitions
    const functionPatterns = {
      javascript: /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g,
      python: /def\s+\w+/g,
      java: /public\s+\w+\s+\w+\s*\(|private\s+\w+\s+\w+\s*\(/g,
      cpp: /\w+\s+\w+\s*\([^)]*\)\s*{/g
    };
    
    const funcPattern = functionPatterns[language as keyof typeof functionPatterns] || functionPatterns.javascript;
    const funcMatches = code.match(funcPattern);
    complexity += funcMatches ? funcMatches.length : 0;
    
    return complexity;
  }

  // Calculate nesting level (simplified)
  private calculateNestingLevel(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of code) {
      if (char === '{' || char === '(') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ')') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
    
    return maxNesting;
  }

  // Calculate AI-generated probability (simplified heuristic)
  private calculateAIGeneratedProbability(code: string, language: string): number {
    let probability = 0;
    
    // Check for AI-like patterns
    if (this.detectTernaryOperators(code, language)) probability += 0.2;
    if (this.detectDirectReturns(code, language)) probability += 0.3;
    if (!this.detectDuplicateExpressions(code)) probability += 0.1; // AI avoids duplicates
    
    // Check for overly clean code
    const commentRatio = this.calculateCommentRatio(code.split('\n'), language);
    if (commentRatio < 0.05) probability += 0.1; // Very few comments
    
    // Check for typical AI variable names
    if (this.hasAITypicalVariableNames(code)) probability += 0.2;
    
    // Check for overly concise code
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const avgLineLength = this.calculateAverageLineLength(lines);
    if (avgLineLength > 80) probability += 0.1; // Very long lines
    
    return Math.min(probability, 1.0);
  }

  // Check for AI-typical variable names
  private hasAITypicalVariableNames(code: string): boolean {
    const aiTypicalNames = [
      'result', 'output', 'response', 'data', 'value', 'item', 'element',
      'temp', 'tmp', 'arr', 'list', 'dict', 'obj', 'str', 'num'
    ];
    
    const words = code.match(/\b\w+\b/g) || [];
    const aiNameCount = words.filter(word => aiTypicalNames.includes(word.toLowerCase())).length;
    
    return aiNameCount > words.length * 0.3; // More than 30% AI-typical names
  }

  // Calculate perplexity score (simplified)
  private calculatePerplexityScore(code: string, language: string): number {
    // Simplified perplexity calculation based on code structure
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return 0;
    
    let perplexity = 0;
    
    // Check for unusual patterns
    const unusualPatterns = [
      /^\s*return\s+[^;{]+;?$/gm, // Direct returns
      /\?\s*.*\s*:/g, // Ternary operators
      /=>\s*{/g, // Arrow functions
      /\.map\s*\(/g, // Map functions
      /\.filter\s*\(/g, // Filter functions
      /\.reduce\s*\(/g // Reduce functions
    ];
    
    for (const pattern of unusualPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        perplexity += matches.length * 0.1;
      }
    }
    
    // Normalize by code length
    return Math.min(perplexity / lines.length, 1.0);
  }

  // Analyze structural patterns
  private analyzeStructuralPatterns(code: string, language: string) {
    return {
      functionCount: this.countFunctions(code, language),
      classCount: this.countClasses(code, language),
      importCount: this.countImports(code, language),
      variableNamingPattern: this.detectVariableNamingPattern(code)
    };
  }

  // Count function definitions
  private countFunctions(code: string, language: string): number {
    const patterns = {
      javascript: /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g,
      python: /def\s+\w+/g,
      java: /public\s+\w+\s+\w+\s*\(|private\s+\w+\s+\w+\s*\(/g,
      cpp: /\w+\s+\w+\s*\([^)]*\)\s*{/g
    };
    
    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    const matches = code.match(pattern);
    return matches ? matches.length : 0;
  }

  // Count class definitions
  private countClasses(code: string, language: string): number {
    const patterns = {
      javascript: /class\s+\w+/g,
      python: /class\s+\w+/g,
      java: /class\s+\w+|public\s+class\s+\w+/g,
      cpp: /class\s+\w+/g
    };
    
    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    const matches = code.match(pattern);
    return matches ? matches.length : 0;
  }

  // Count import statements
  private countImports(code: string, language: string): number {
    const patterns = {
      javascript: /import\s+.*from|require\s*\(/g,
      python: /import\s+\w+|from\s+\w+\s+import/g,
      java: /import\s+\w+/g,
      cpp: /#include\s*</g
    };
    
    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    const matches = code.match(pattern);
    return matches ? matches.length : 0;
  }

  // Detect variable naming pattern
  private detectVariableNamingPattern(code: string): string {
    const variables = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    let camelCase = 0;
    let snakeCase = 0;
    let pascalCase = 0;
    
    for (const variable of variables) {
      if (/^[a-z][a-zA-Z0-9]*$/.test(variable)) {
        camelCase++;
      } else if (/^[a-z][a-zA-Z0-9]*_[a-zA-Z0-9_]*$/.test(variable)) {
        snakeCase++;
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(variable)) {
        pascalCase++;
      }
    }
    
    const total = camelCase + snakeCase + pascalCase;
    if (total === 0) return 'unknown';
    
    if (camelCase / total > 0.5) return 'camelCase';
    if (snakeCase / total > 0.5) return 'snake_case';
    if (pascalCase / total > 0.5) return 'PascalCase';
    
    return 'mixed';
  }

  // Detect code anomalies based on research insights
  detectCodeAnomalies(features: CodeStylometryFeatures): {
    isSuspicious: boolean;
    anomalies: string[];
    confidence: number;
  } {
    const anomalies: string[] = [];
    let confidence = 0;

    // Check AI-generated probability
    if (features.aiGeneratedProbability > 0.7) {
      anomalies.push('High probability of AI-generated code');
      confidence += 0.4;
    }

    // Check for ChatGPT-like patterns
    if (features.hasTernaryOperators && features.hasDirectReturns) {
      anomalies.push('Code exhibits ChatGPT-like patterns (ternary operators + direct returns)');
      confidence += 0.3;
    }

    // Check for overly clean code
    if (features.commentRatio < 0.02 && features.lineCount > 20) {
      anomalies.push('Unusually clean code with minimal comments');
      confidence += 0.2;
    }

    // Check for unusual complexity
    if (features.complexityScore < 2 && features.lineCount > 30) {
      anomalies.push('Unusually simple code for its length');
      confidence += 0.2;
    }

    // Check for AI-typical naming patterns
    if (features.structuralPatterns.variableNamingPattern === 'camelCase' && 
        features.structuralPatterns.functionCount > 5) {
      anomalies.push('Consistent camelCase naming (AI-typical)');
      confidence += 0.1;
    }

    return {
      isSuspicious: confidence > 0.3,
      anomalies,
      confidence: Math.min(confidence, 1.0)
    };
  }
}
