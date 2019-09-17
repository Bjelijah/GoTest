package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)





func main()  {
	//testRESTApi()
	testH5()
}

func testRESTApi(){
	r := gin.Default()
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run("192.168.1.147:8087") // listen and serve on 0.0.0.0:8080
}

func testH5()  {
	r := gin.Default()
	r.Static("css","template/css")
	r.Static("fonts","template/fonts")
	r.Static("img","template/img")
	r.Static("js","template/js")
	r.Static("mcscore","template/mcscore")
	r.Static("scores","template/scores")
	r.Static("sounds","template/sounds")
	r.LoadHTMLFiles("template/index.html")
	r.GET("/index", func(c *gin.Context) {
		c.HTML(
			http.StatusOK,
			"index.html",
			nil)
	})
	r.Run("192.168.1.147:8087")
}


