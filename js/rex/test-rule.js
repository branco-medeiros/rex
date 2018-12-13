define(["utils/test", "utils/char-class", "./peg", "types/context"],
function(test, cc, peg, context){

  function breakLevels(v) {
    return v.replace(/\(([0-2]):/g, "\r\n($1:")
  }

  function testRuleDisplay(){
    test("RULE  -- display", function(chk, msg){

      var g = peg.grammar()
      var test = g("test")
      var options = {noLineBreaks: true}

      msg("Using rule 'test'...")
      chk("test.assign(cc.letter)", test.assign(cc.letter)).isValid()
      chk("...and test.body.length", test.body.length).is(1)
      chk("...and test.fullDisplay()", test.fullDisplay(options)).is("test = <letter>")

      //////////////////////////////////////////////////////////////////////////
      msg("")
      chk(
        "test.assign(cc.letter, cc.digit, cc.control)",
        test.assign(cc.letter, cc.digit, cc.control)
      ).isValid()

      chk("...and test..body.length", test.body.length).is(3)

      chk("...and test.fullDisplay()", test.fullDisplay(options))
      .is("test = <letter> | <digit> | <control>")

      //////////////////////////////////////////////////////////////////////////
      msg("")
      chk(
        "test.assign([cc.letter, cc.digit, cc.control])",
        test.assign([cc.letter, cc.digit, cc.control])
      ).isValid()

      chk("...and test.body.length", test.body.length).is(1)

      chk("...and test.fullDisplay()", test.fullDisplay(options))
      .is("test = <letter> <digit> <control>")
    })
  } //testRuleDisplay

  function testSimpleMatch(){
    test("RULE -- simple match", function(chk, msg){
      var g = peg.grammar()
      var options = {noLineBreaks: true}
      var ident = g("ident").assign([
          cc.letter,
          peg.star(
            peg.alt(
              peg.plus(cc.alphanum),
              [peg.alt(".", "_", "-"), peg.plus(cc.alphanum)]
            )
          )
        ])
      msg("Using the 'ident' rule bellow:")
      msg(ident.fullDisplay())

      var ctx = context.from("abc.1234-x_y_z")

      //////////////////////////////////////////////////////////////////////////
      var ret = chk(`ret = ident.match(${ctx})`, ident.match(ctx)).isValid()
      chk("...and ret.finished", ret.finished).isTrue()
      chk("...and ret.result.peek()",  ret.result.peek().toString())
      .is("(N/R 0:? (ident 0:14))")

    })
  } //testSimpleMatch

  function testSubRuleMatch(){
    test("RULE -- sub rule match", function(chk, msg){
      var g = peg.grammar()
      var options = {noLineBreaks: true}
      var identFirst = g("ident-first").assign(cc.letter)
      var identText = g("ident-text").assign(peg.plus(cc.alphanum))
      var identSep = g("ident-sep").assign([peg.alt(".", "_", "-"), identText])
      var ident = g("ident").assign([identFirst, peg.star(peg.alt(identText, identSep))])

      msg("For the following grammar:")
      msg(ident.fullDisplay(options))
      msg(identFirst.fullDisplay(options))
      msg(identText.fullDisplay(options))
      msg(identSep.fullDisplay(options))

      ctx = context.from("abc.1234-x_y_z")

      //////////////////////////////////////////////////////////////////////////
      ret = chk(`ret = ident.match(${ctx})`, ident.match(ctx)).isValid()
      chk("...and ret.finished", ret.finished).isTrue()
      chk(
        "...and ret.peekResult()",
        breakLevels(ret.peekResult().display({showILevel:true}))
      ).is(breakLevels(
        "(0:N/R 0:? " +
        "(1:ident 0:14 " +
        "(2:ident-first 0:1) " +
        "(2:ident-text 1:3) " +
        "(2:ident-sep 3:8 (3:ident-text 4:8)) " +
        "(2:ident-sep 8:10 (3:ident-text 9:10)) " +
        "(2:ident-sep 10:12 (3:ident-text 11:12)) " +
        "(2:ident-sep 12:14 (3:ident-text 13:14))))"
      ))

    })
  } //testSubRuleMatch

  function testDirectLeftRecursion(){
    test("RULE -- direct left recursion", function(chk, msg){

      var g = peg.grammar()
      var options = {noLineBreaks: true}
      var expr = g("expr").assign([g("expr"), "+", "n"], "n")
      expr.body[0].prec = 10

      msg("For the 'expr' rule bellow:")
      msg(expr.fullDisplay(options))

      ctx= context.from("n+n+n")

      window.result = ctx.result

      //////////////////////////////////////////////////////////////////////////
      ret = chk(`ret = expr.match(${ctx})`, expr.match(ctx)).isValid()
      chk("...and ret.finished", ret.finished).isTrue()
      chk("...and ret.peekResult()", ret.peekResult().toString())
      .is("(N/R 0:? (expr 0:5 (expr 0:3 (expr 0:1))))")
    })
  } //testDirectLeftRecursion


  function testIndirectLeftRecursion(){
    test("RULE -- indirect left recursion", function(chk, msg){

      var g = peg.grammar()
      var options = {noLineBreaks: true}
      var expr = g("expr")
      var add = g("add")
      var num = g("num")
      add.assign([fn("add"), expr, "+", num])
      num.assign([fn("num"), peg.plus(cc.digit)])
      expr.assign(add, num)
      expr.body[0].prec = 10


      function fn(v){
        return peg.fn(
          function(){
            msg(v)
          }
        )
      }

      msg("For the following grammar:")
      msg(g.display(options))

      ctx= context.from("1+2+3")
      msg("...and the following input:")
      msg(ctx)


      window.memo = ctx.memo
      window.result = ctx.result

      //////////////////////////////////////////////////////////////////////////
      ret = chk(`ret = expr.match(${ctx})`, expr.match(ctx)).isValid()
      chk("ret.peekResult()", ret.peekResult().display({showILevel:true}))
      .is(
        "(0:N/R 0:? " +
        "(1:expr 0:5 " +
        "(2:add 0:5 " +
        "(3:expr 0:3 " +
        "(4:add 0:3 " +
        "(5:expr 0:1 " +
        "(6:num 0:1)) " +
        "(5:num 2:3))) " +
        "(3:num 4:5))))"
      )

    })
  } //testDirectLeftRecursion

  function testIndirectLeftRecursionSubRules(){
    test("RULE -- indirect left recursion -- with sub rules", function(chk, msg){

      var g = peg.grammar()
      var options = {noLineBreaks: true}
      var expr = g("expr").assign(g("add"), g("sub"), g("expr2"))
      var expr2 = g("expr2").assign(g("mul"), g("div"), g("expr3"))
      var expr3 = g("expr3").assign(g("num"), g("grp"))
      expr.body[0].prec = 10
      expr.body[1].prec = 10
      expr2.body[0].prec = 20
      expr2.body[1].prec = 20

      _ = g("_").assign(peg.star(" "))

      function fn(v){
        return peg.fn(
          function(){
            msg(v)
          }
        )
      }
      g("add").assign([fn("add"), expr, "+", _, expr2])
      g("sub").assign([fn("sub"), expr, "-", _, expr2])
      g("mul").assign([fn("mul"), expr2, "*", _, expr3])
      g("div").assign([fn("div"), expr2, "/", _, expr3])
      g("num").assign([fn("num"), peg.plus(cc.digit), _])
      g("grp").assign([fn("grp"), "(", _, g("expr"), ")", _])

      msg("For the following grammar:")
      msg(g.display(options))

      ctx= context.from("1 + 2 * 3 * (5 - 4) / 6")
      msg("...and the following input:")
      msg(ctx)


      window.memo = ctx.memo
      window.result = ctx.result

      //////////////////////////////////////////////////////////////////////////
      ret = chk(`ret = expr.match(${ctx})`, expr.match(ctx)).isValid()
    })
  } //testDirectLeftRecursion


  function testMutualLeftRecursion(){
    test("RULE -- mutually left recursive rule", function(chk, msg){
      var g = peg.grammar();
      var sel = g("sel")
      var pref = g("pref")
      var id = g("id")
      var num = g("num")
      sel.assign([pref, ".", id], id)
      sel.body[0].prec = 10

      pref.assign([pref, "(", num, ")"], sel)
      pref.body[0].prec = 10

      id.assign(peg.plus(cc.letter))
      num.assign(peg.plus(cc.digit))

      var ctx = context.from("a(1)(2).b(3).c")
      window.result = ctx.result
      var ret = chk(`ret = sel.match(${ctx})`, sel.match(ctx)).isValid()
      chk("ret.peekResult()", ret.peekResult().display({showILevel:true})).isValid()
    })

  }


  return test.asTest({
    testRuleDisplay: testRuleDisplay,
    testSimpleMatch: testSimpleMatch,
    testSubRuleMatch: testSubRuleMatch,
    testDirectLeftRecursion: testDirectLeftRecursion,
    testIndirectLeftRecursion: testIndirectLeftRecursion,
    testIndirectLeftRecursionSubRules: testIndirectLeftRecursionSubRules,
    testMutualLeftRecursion: testMutualLeftRecursion
  })

})
