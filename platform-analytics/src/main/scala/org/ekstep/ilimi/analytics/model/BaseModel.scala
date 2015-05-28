package org.ekstep.ilimi.analytics.model

import java.io.Serializable

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.DataFrame
import org.apache.spark.sql.hive.HiveContext
import org.ekstep.ilimi.analytics.conf.AppConf
import org.json4s.DefaultFormats
import org.json4s.jackson.JsonMethods.parse
import org.json4s.jvalue2extractable
import org.json4s.string2JsonInput
import org.json4s.Extraction
import org.json4s.jackson.JsonMethods.pretty

case class Eks(dspec: Option[Any], loc: Option[Any], length: Option[Long], ueksid: Option[String], gid: Option[String], err: Option[Any], subj: Option[String], mc: Option[String], skill: Option[String], qid: Option[String], qtype: Option[String], qlevel: Option[String], score: Option[Int], maxscore: Option[Int], exlength: Option[Int], atmpts: Option[Int], failedatmpts: Option[Int], topics: Option[Any], current: Option[Int], max: Option[Int])
case class Edata(eks: Eks)
case class Event(eid: String, ts: Long, ver: String, sid: Option[String], uid: Option[String], did: String, edata: Edata)

abstract class BaseModel extends Serializable {

    var location: String = null;
    var parallelization: Int = AppConf.getConfig("default.parallelization").toInt;

    def validate(args: Array[String]): Boolean;

    def compute(args: Array[String]);

    def initializeSparkContext(location: String, parallelization: String): SparkContext = {
        this.location = location;
        val conf = new SparkConf().setMaster("local").setAppName("TestSparkDriver");
        val sc = new SparkContext(conf);
        if ("S3".equals(location)) {
            sc.hadoopConfiguration.set("fs.s3n.awsAccessKeyId", AppConf.getConfig("s3_aws_key"));
            sc.hadoopConfiguration.set("fs.s3n.awsSecretAccessKey", AppConf.getConfig("s3_aws_secret"));
        }
        Console.println("### Spark Context instantiated ###");
        if (null != parallelization) {
            this.parallelization = parallelization.toInt;
        }
        sc;
    }

    def closeSparkContext(sc: SparkContext) {
        sc.stop();
    }

    def getPath(relPath: String): String = this.location match {
        case "S3" => AppConf.getConfig("s3_bucket") + relPath;
        case _    => relPath
    }

    def loadInput(sc: SparkContext, input: String, filter: Event => Boolean): RDD[Event] = {
        Console.println("### Fetching Input:" + getPath(input) + " ###");
        val rdd = sc.textFile(getPath(input), this.parallelization).cache();
        rdd.map { x =>
            {
                implicit val formats = DefaultFormats;
                parse(x).extract[Event]
            }
        }.filter { x => filter(x) }
    }
    
    def saveResult(sc: SparkContext, seq: Seq[Any], output: String) = {
        sc.parallelize(seq.map { output =>
            {
                implicit val formats = DefaultFormats;
                pretty(Extraction.decompose(output))
            }
        }, this.parallelization).saveAsTextFile(output);
    }

}