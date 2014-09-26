/**
 * Router spec for mvc
 * @author yiminghe@gmail.com
 */

/*jshint quotmark:false*/
var Router = require('router');
var getHash = function () {
    return Router.Utils.getHash(location.href);
};
var util = require('util');
var UA = require('ua');

describe("router using hash", function () {
    this.timeout(10000);
    beforeEach(function (done) {
        Router.config({
            useHash: true
        });
        location.hash = '';
        setTimeout(done, 900);
    });

    afterEach(function () {
        Router.stop();
        Router.clearRoutes();
    });

    it("works", function (done) {
        var ok = 0,
            ok3 = 0,
            ok4 = 0,
            ok2 = 0;

        Router.get("/detail/:id", function (req) {
            var paths = req.params;
            var query = req.query;
            expect(paths.id).to.be("9999");
            expect(query.item1).to.be("1");
            expect(query.item2).to.be("2");
            ok2++;
        });

        Router.get("/list/*", function (req) {
            var paths = req.params;
            var query = req.query;
            expect(paths[0]).to.be("what/item");
            expect(query.item1).to.be("1");
            expect(query.item2).to.be("2");
            expect(req.path).to.be('/list/what/item');
            expect(req.url).to.be('/list/what/item?item1=1&item2=2');
            ok++;
        });

        Router.get(/^\/list-(\w)$/, function (req) {
            expect(req.params[0]).to.be('t');
            ok4++;
        });

        Router.get("/:path*", function (req) {
            expect(req.params.path).to.be("haha");
            expect(req.params[0]).to.be("/hah2/hah3");
            expect(req.params[1]).to.be("hah2/hah3");
            ok3++;
        });

        expect(Router.matchRoute('/list/what/item')).to.be.ok();

        expect(Router.matchRoute('/list2/what/item')).to.be.ok();

        Router.start();

        var tasks = [
            waits(200),

            runs(function () {
                Router.navigate("/list/what/item?item1=1&item2=2");
            }),

            waits(200),

            runs(function () {
                Router.navigate("/detail/9999?item1=1&item2=2");
            }),

            waits(200),

            runs(function () {
                Router.navigate("/haha/hah2/hah3");
            }),

            waits(200),

            runs(function () {
                Router.navigate("/list-t");
            }),

            waits(200),

            runs(function () {
                expect(ok).to.be(1);
                expect(ok2).to.be(1);
                expect(ok3).to.be(1);
                expect(ok4).to.be(1);
            })
        ];

        async.series(tasks, done);
    });

    var ie = UA.ieMode;

    if (ie && ie < 8) {
        // return;
    }

    // ie8 iframe 内 重复刷新！
    // firefox
    if (ie && window.frameElement || UA.firefox) {
        return;
    }

    // ie<8 can only used on event handler
    // see ../others/test-replace-history.html
    it("can replace history", function (done) {
        var go = 0,
            list = 0,
            detail = 0;

        var tasks = [
            waits(200),

            runs(function (next) {
                util.each({
                    "/go/": function () {
                        go++;
                    },
                    "/list/": function () {
                        list++;
                    },
                    "/detail/": function () {
                        detail++;
                    }
                }, function (func, route) {
                    Router.get(route, func);
                });

                Router.start(function () {
                    setTimeout(function () {
                        Router.navigate("/list/");
                        next();
                    }, 190);
                });
            }),

            waits(500),

            runs(function () {
                Router.navigate("/detail/", {
                    replace: 1
                });
            }),

            waits(200),

            runs(function () {
                Router.navigate("/go/");
            })
        ];

        // phantomjs can not back?
        if (UA.phantomjs) {
            async.series(tasks, done);
            return;
        }
        tasks = tasks.concat([
            waits(200),

            runs(function () {
                history.back();
            }),

            waits(200),

            runs(function () {
                expect(getHash()).to.be('/detail/');
            }),

            waits(200),

            runs(function () {
                history.back();
            }),

            waits(200),

            runs(function () {
                expect(getHash()).to.be('/');
            }),

            runs(function () {
                expect(go).to.be(1);
                expect(detail).to.be(2);
                expect(list).to.be(1);
            })
        ]);

        async.series(tasks, done);
    });

});