package main

import (
	"./bean"
	"./db"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

func TestPost(c *gin.Context) {
	var test bean.Person
	if c.ShouldBind(&test) == nil {
		log.Println(test.Name)
		log.Println(test.Age)
		c.JSON(http.StatusOK, gin.H{
			"name": test.Name,
			"age":  test.Age,
		})
	}
}

func CreatePerson(c *gin.Context) {
	var p bean.Person
	if c.ShouldBind(&p) == nil {
		db.AddDb(p.Id, p.Name, p.Age)
		c.JSON(http.StatusOK, gin.H{
			"code": http.StatusOK,
		})
	}
}

func GetAllPerson(c *gin.Context) {
	db.GetAllDb()
	c.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
	})
}
