# Rex #

1) drop in replacement for regular expressions
2) can convert a regex to it~s own grammar. rex grammars intend to be more readable than regexes
3) acceps any enumerable as the subject besides chars
4) api:
   - find(what, options, subject)
   - replace(what, options, subject, by)
   - match(what, options, subject)
   - test(what, options, subject)
   - parse(grammar)
   - map?
   
   
5) features:
    - uses combinators for matching, with support for custom combinators;
      combinators available:
      
      - lit: matches a subject element
      - and: matches all elements of a list combinators
      - or: test each elements of a list of combinators until a match is found
      - *alt: creates an LR set out of a list of combinators
      - rep: repeated matches a combinator until no more matches are possible
      - opt: optionally matches a combinator
      - star: matches a combinator zero or more times
      - plus: matches a combinator one or more times
      - is: zero-length look ahead
      - isnot: zero-length negative lookahead
      - *was: [not implemented] zero-lenght look behind
      - *wasnot: zero-length negative look behind
      - any: matches any single element of the subject
      - true: always matches
      - bof: matches only at the beginning of the file
      - eof: matches if the subject is exhausted
      - *bol: matches at the begining of a line (for string subjects)
      - *eol: matches at the end of the line (for string subjects)
      - oneof: matches one of the elements of an enumerator
      - seq: matches the elements of an enumerator
      - var: creates a named reference of the combinator
      - rev: matches the contents of a previous var
      - fn: matches after a user supplied function
      - skip: advances the matching position to skip the combinator
      - upto: advances the matching position until the combinator is found
      - warning: emits an error message and succeeds
      - error: emits an error message and fails
      - abort: interrupts the matching with an error message
      
    - supports rules and grammars. The rules in rex grammars have the following features:
      - rules are cobinators
      - supports direct, indirect and mutual left recursive rules
      - *parameterized rules
    
    
--------------------------------------------------------------------------------
rex internals:

the context and most matchers are not typed, but there is a data extraction typed
interface.

so, from the rex class, a typed context is created -- which will create a typed
result and typed captures (the capture object is not concerned with the actual type 
of the capture, only with its range). a typed capture can then be extracted
because the actual context is already typed

-- parse results:
  parse results are created from rules in the context. by issuing enter and leave
  commands, the rules govern the creation of parse nodes.
  
  inside these nodes we have:
  a) the rule that was being parsed
  b) the range in the input that was matched by the rule
  c) captures that occurred in the rule body
  d) a list of children nodes representing rules activated by the parsing rule
  
context.root/context.result return these nodes (where context.root represents
an anonymous rule at the root of the parsing)

captures represent a list of named captures. Upon creating a rex expression, 
it is scanned to identify the active captures, even the ones inside containing
matchers (except from rules). this is necessary to give appropriate indexes to anonymous
captures.

ex:
[%d+][


so, for example we would have

find(exp, text) -- where exp is a matcher|string and text is a string
1) a StringContext is create and passed to exp
2) uppon the result, we can generate a match specifically typed 


## minimum rex api and objects

classes needed: 

  stk
  ctx
  matcher
  rex
  rule
  grammar
  parse
  match
  capture
    

-- rex
rex.find(matcher, text): match
rex.findAll(matcher, text): match[]
rex.eval(matcher, text): context
rex.test(matcher, text): boolean
rex.replace(matcher, text, value): t
rex.replaceAll(matcher, text, value): t
--
rex.lit(value): matcher
rex.and(matcher...): matcher
rex.or(matcher...): matcher
rex.any: matcher
rex.rep(min, max, matcher): matcher
rex.star(matcher): matcher
rex.opt(matcher): matcher
rex.plus(matcher): matcher
rex.is(matcher): matcher
rex.isnot(matcher): matcher
rex.eps: matcher
rex.bof: matcher
rex.eof: matcher
rex.bol: matcher
rex.eol: matcher
rex.cap(id, matcher): matcher
rex.recap(id): matcher
rex.seq(value...): matcher
rex.oneof(value...): matcher
rex.abort(msg): matcher
rex.warn(msg): matcher
rex.fn(function): matcher
rex.prec(prec, rule): matcher
rex.grammar: grammar
rex.parse(text): grammar

-- matcher
matcher.match(ctx): boolean

-- rule is an instance of matcher, rexer    
rule.findIn(source): match
rule.findAllIn(source): match[]
rule.evalIn(source): context
rule.testIn(source): boolean
rule.replaceIn(source, value): t
rule.replaceAllIn(source, value): t
rule.match(ctx): boolean
rule.name: string
rule.body: matcher[]

-- grammar
grammar.findIn
grammar.findAllIn
grammar.evalIn
grammar.test
grammar.replaceIn
grammar.replaceAllIn
grammar.match


--match is an instance of span
match.matched: boolean
match.next: match
match.start: int
match.end: int
match.value: t[]
match.cap(id): capture
match.get(i): parse
match.get(name): parse
match.group(id) capture[]
match.result: parse

--capture is an instance of span
capture.start: int
capture.end: int
capture.value: T[]
capture.name: string
capture.clone: capture

-- context
context.source: t[]
context.position: int
context.matched: boolean
context.failed: boolean
context.finished: boolean
context.at(pos): t
context.current: t
context.moveNext:boolean
context.result: parse
context.root: parse
context.matches(pos, value): boolean
context.matches(value): boolean
context.inrange(first, last:t) boolean
context.span(first, last): T[]
context.slice(first, count): T[]
context.clone: context

-- parse represents the parse tree
parse.rule: rule
parse.cap(id): capture
parse.group(id): capture[]
parse.get(i): parser
parse.get(id): parser


--------------------------------------------------------------------------------
Context interface:
- current
- getAt
- position
- count
- finished
- succeeded
- failed
- matches(v)
- matches(v1, v2)
- matchesAt(p, v)
- matchesAt(p, v1, v2)
- enter(symbol)
- leave(symbol, start, matched)
- moveNext
- fail
- succeed

capture and rules would be instances of notifying matchers, which would call
enter and leave accordinggly

DateInterval fromPattern(){
  Pattern rp = Pattern.compile(
    "^(" +
    "(\d+)(\.|-|/)(\d+)\3(\d+)|" + //day month year
    "(\d+)(\.|-|/)(\d+)|" + //month year
    "(\d+)" + //year
    ")$");
  Matcher m = rp.matches("12/10/2010");
  if(m.success){
    if(m.capture(9).value != null){
      return new DateInterval(
        Integer.parse(m.capture(9).value)
      );
      
    } else if(m.capture(8).value != null){
      return new DateInterval(
        Integer.parse(m.capture(8).value), 
        Integer.parse(m.capture(7).value) - 1
      );
      
    } else {
      return new DateInterval(
        Integer.parse(m.capture(2).value), 
        Integer.parse(m.capture(4).value) - 1, 
        Integer.parse(m.capture(5).value)
      );
    }
  }
}

DateInterval fromRexMatcher(){
  Rex r = Rex.Compile(
    "#bof(" +
    "day:%d+ sep:#oneof('.-/') month:%d+ $sep year:%d+ | " +
    "month:%d+ #oneof('.-/') year:%d+ | " +
    "year:%d+" +
    ")#eof");
    
  Matcher<String> m = r.matches("10/12/2010");
  if(m.success){
    if(m.capture("day").value != null){
      return new DateInterval(
        Integer.parse(m.capture("year").value),
        Integer.parse(m.capture("month").value) - 1,
        Integer.parse(m.capture("day").value)
      );
      
    } else if(m.capture("m").value != null){
      return new DateInterval(
        Integer.parse(m.capture("year").value),
        Integer.parse(m.capture("month").value) - 1
      );
      
    } else {
      return new DateInterval(
        Integer.parse(m.capture("year").value)
      );
    }
  }
}

DateInterval fromRexParser(){
  Parser p = rex.parser(
    "date = #bof(day-month-year | month-year | year)#eof; " +
    "day-month-year = [d] [sep] [m] $sep [y]; " +
    "month-year = [m] sep [y]; " +
    "year = [y]; " +
    "sep = #oneof('.-/'); " +
    "d = number; " +
    "m = number; " +
    "y = number; " +
    "number = %d+"
  );
   
  Parse<String> r = p.parse("12/10/2010");
  if(r.success){
    Node<String> n = r.root.get(0);
    if(n.isNamed("day-month-year")){
      return new DateInterval(
        Integer.parse(n.get("y").value),
        Integer.parse(n.get("m").value) - 1,
        Integer.parse(n.get("d").value)
      );
    } else n.isNamed("month-year"){
      return new DateInterval(
        Integer.parse(n.get("y").value),
        Integer.parse(n.get("m").value) - 1
      );
    } else {
      return new DateInterval(
        Integer.parse(n.get("y").value)
      );
    }
  } else {
    throw new RuntimeException(r.errorMessage("Invalid Date Interval");
  }
}

DareInterval fromMatcher(){
  Rex r = new Rex();
    "#bof(" +
    "day:%d+ sep:#oneof('.-/') month:%d+ $sep year:%d+ | " +
    "month:%d+ #oneof('.-/') year:%d+ | " +
    "year:%d+" +
    ")#eof");
  Matcher m = r.seq(
    r.bof(),
    r.alt(
      r.seq(
        r.cap("day", r.plus(r.digit())),
        r.cap("sep", r.oneof(".-/")),
        r.cap("month", r.plus(r.digit())),
        r.recall("sep"),
        r.cap("year", r.plus(r.digit()))
      ),
      r.seq(
        r.cap("month", r.plus(r.digit())),
        r.oneof(".-/"),
        r.cap("year", r.plus(r.digit()))
      ),
      r.cap("year", r.plus(r.digit()))
    ),
    r.eof()
  )
  
  #bof d1:%d+ (sep:#oneof('-./') d2:%d+ ($sep (d3:%d+ | #error 'expected digits')| #any #error 'expected $sep')? | #any )? #eof 
  
        
        


}
--------------------------------------------------------------------------------
rex structure:

  rex: the main class and namespace
    - rex.builder: the singleton class used to create matchers
    - rex.find(matcher, input as T) as match
      match will return information about the found value
        - match(
          - success: boolean
          - value: T
          - position: int
          - capture(id): fragment
          - captures: list of fragments that can be filtered by id
        )
        
    - rex.findAll(matcher, input) as match[]
     
    - rex.replace(matcher, input as T, replacement): T
    - rex.replaceAll(matcher, input as T, replacement): T
    
    - rex.compile(grammar as string) as grammar
    - rex.parser(grammar as string|grammar) as parser
    
    - matcher.find(input as T) as match%T
    - matcher.findAll(input as T) as match%(T)[]
    - mathcer.replace(input as T, replacement) as T
    - matcher.replaceAll(input as T, replacement) as T
    

Usage in Java

  1) Find text
  a)
  Match<CharSequence> m = Peg.find("<letter>|<_>, (<letter>|<_>|<digi>)*", sometext)
  while(m.found){
    print(m.value)
    m = m.findNext()
  }

  b)
  for(String s:Peg.find(....)) print(s)

  c)
  Iterator<CHaracter> i = Peg.find(...).getIterator()
  while(i.hasNext()) print(i.next())
  
  
  2) Find all text
  a)
  Match<CharSequence> m = Peg.findAll(....)
  while(m.found){
    print(m.value)
    m = m.findNext()
  }
  
  b)
  List<String> matches = Peg,findAll(....).getAllValues()
  
  3) Replace
  Replacer<CharSequence> r = Peg.replace(patt, on, value)
  while(r.replaced) {
    print(r.value, " -> ", r.replacement)
    r.replaceNext(value)
  }
  
  
  
  
  