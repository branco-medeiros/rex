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
    