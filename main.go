package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"net/http"
)

func main() {
	//testRESTApi()
	testH5()

}

func testRESTApi() {
	r := gin.Default()
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run("192.168.1.147:8087") // listen and serve on 0.0.0.0:8080
}

func testH5() {
	r := gin.Default()
	api := r.Group("/api")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "pong",
				"test":    "asdf",
			})
		})
		api.POST("/testPost", TestPost)

		api.POST("/create", CreatePerson)

		api.GET("/person", GetAllPerson)
	}

	h5 := r.Group("/index")
	{
		h5.Static("css", "template/css")
		h5.Static("fonts", "template/fonts")
		h5.Static("img", "template/img")
		h5.Static("js", "template/js")
		h5.Static("mcscore", "template/mcscore")
		h5.Static("scores", "template/scores")
		h5.Static("sounds", "template/sounds")
		r.LoadHTMLFiles("template/index.html")
		h5.GET("/", func(c *gin.Context) {
			c.HTML(
				http.StatusOK,
				"index.html",
				nil)
		})
	}
	r.Run("192.168.1.147:8087")
}
